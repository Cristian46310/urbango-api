import logging
import re

from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.pqrs.domain.ports.illm_provider import ILLMProvider
from app.pqrs.infrastructure.clients.llm_providers import FallbackLLMProvider
from app.weather.domain.entities.weather_assessment import WeatherRiskLevel
from app.weather.domain.entities.weather_forecast import WeatherForecast
from app.weather.domain.ports.iweather_interpreter import IWeatherInterpreter

logger = logging.getLogger(__name__)


class AssessState(TypedDict, total=False):
    forecast: WeatherForecast
    risk_level: WeatherRiskLevel
    lat: float
    lon: float
    explanation: str
    recommendation: str


ASSESS_SYSTEM = (
    "Eres un asistente del Sistema Inteligente de Transporte de UCaldas. "
    "Interpretas datos meteorológicos YA CALCULADOS. "
    "NUNCA inventes temperatura, humedad, viento, probabilidad de lluvia ni nivel de riesgo. "
    "Usa solo los números del mensaje del usuario. "
    "Responde en español, tono claro y breve. "
    "Formato EXACTO:\n"
    "EXPLICACION:\n"
    "<2-3 oraciones con los datos dados>\n"
    "RECOMENDACION:\n"
    "<1-2 oraciones prácticas para el viajero>"
)


def _fallback_texts(forecast: WeatherForecast, risk: WeatherRiskLevel) -> tuple[str, str]:
    explanation = (
        f"Pronóstico cerca de las {forecast.matched_local_time or 'hora solicitada'}: "
        f"{forecast.temperature_c}°C (sensación {forecast.feels_like_c}°C), "
        f"humedad {forecast.humidity_percent}%, viento {forecast.wind_speed_ms} m/s, "
        f"probabilidad de lluvia {forecast.rain_probability}%. "
        f"Condición: {forecast.condition or forecast.description}. "
        f"Nivel de riesgo evaluado: {risk.value}."
    )
    if risk == WeatherRiskLevel.HIGH:
        recommendation = (
            "Sal 15 minutos antes y lleva paraguas. Espera posibles demoras en el tráfico."
        )
    elif risk == WeatherRiskLevel.MEDIUM:
        recommendation = "Lleva protección contra lluvia y revisa el clima antes de salir."
    else:
        recommendation = "Clima favorable para el viaje. Mantén tus tiempos habituales."
    return explanation, recommendation


class LangGraphWeatherInterpreter(IWeatherInterpreter):
    def __init__(self, llm_provider: ILLMProvider | None = None) -> None:
        self.llm = llm_provider or FallbackLLMProvider()
        self.graph = self._build_graph()

    def compose(
        self,
        forecast: WeatherForecast,
        risk_level: WeatherRiskLevel,
        *,
        lat: float,
        lon: float,
    ) -> tuple[str, str]:
        state: AssessState = {
            "forecast": forecast,
            "risk_level": risk_level,
            "lat": lat,
            "lon": lon,
        }
        try:
            result = self.graph.invoke(state)
            return result.get("explanation", ""), result.get("recommendation", "")
        except Exception as exc:
            logger.warning("Weather interpreter failed, using template: %s", exc)
            return _fallback_texts(forecast, risk_level)

    def _build_graph(self):
        graph = StateGraph(AssessState)
        graph.add_node("compose", self._compose)
        graph.set_entry_point("compose")
        graph.add_edge("compose", END)
        return graph.compile()

    def _compose(self, state: AssessState) -> AssessState:
        forecast = state["forecast"]
        risk = state["risk_level"]
        user_prompt = (
            f"Coordenadas: lat={state['lat']}, lon={state['lon']}\n"
            f"Bloque OpenWeather: {forecast.matched_local_time}\n"
            f"Hora de viaje solicitada: {forecast.requested_travel_hour:02d}:00\n"
            f"Temperatura: {forecast.temperature_c}°C\n"
            f"Sensación térmica: {forecast.feels_like_c}°C\n"
            f"Humedad: {forecast.humidity_percent}%\n"
            f"Viento: {forecast.wind_speed_ms} m/s\n"
            f"Probabilidad de lluvia: {forecast.rain_probability}%\n"
            f"Condición: {forecast.condition} ({forecast.description})\n"
            f"Nivel de riesgo (YA CALCULADO, no lo cambies): {risk.value}\n"
            "No inventes números. Usa únicamente los datos anteriores."
        )
        try:
            raw = self.llm.generate(ASSESS_SYSTEM, user_prompt)
            explanation, recommendation = self._parse(raw, forecast, risk)
        except Exception as exc:
            logger.warning("LLM assess compose failed: %s", exc)
            explanation, recommendation = _fallback_texts(forecast, risk)
        return {**state, "explanation": explanation, "recommendation": recommendation}

    @staticmethod
    def _parse(
        raw: str,
        forecast: WeatherForecast,
        risk: WeatherRiskLevel,
    ) -> tuple[str, str]:
        exp_match = re.search(
            r"EXPLICACION:\s*\n([\s\S]+?)(?=RECOMENDACION:|$)",
            raw,
            re.IGNORECASE,
        )
        rec_match = re.search(r"RECOMENDACION:\s*\n([\s\S]+)$", raw, re.IGNORECASE)
        fallback_exp, fallback_rec = _fallback_texts(forecast, risk)
        explanation = exp_match.group(1).strip() if exp_match else fallback_exp
        recommendation = rec_match.group(1).strip() if rec_match else fallback_rec
        return explanation, recommendation
