from app.config.settings import settings
from app.weather.domain.entities.weather_forecast import WeatherForecast
from app.weather.domain.entities.weather_notification import WeatherNotification

WEATHER_EMAIL_SYSTEM = (
    "Eres un asistente del Sistema Inteligente de Transporte de UCaldas. "
    "Redactas alertas de clima personalizadas para ciudadanos que planean viajar. "
    "Usa español, tono cercano y amable, máximo 3-4 oraciones. "
    "Incluye un emoji al inicio acorde al clima. "
    "Responde EXACTAMENTE con este formato:\n"
    "ASUNTO: <asunto corto>\n"
    "MENSAJE:\n"
    "<mensaje personalizado>"
)


def build_weather_alert_prompt(
    subscription: WeatherNotification,
    forecast: WeatherForecast,
    rain_threshold: int,
) -> str:
    is_rainy = forecast.rain_probability > rain_threshold
    travel_time = f"{subscription.travel_hour:02d}:00"
    forecast_time = forecast.matched_local_time or "hora aproximada del pronóstico"

    if is_rainy:
        recommendation = (
            "Hay alta probabilidad de lluvia. Recomienda salir 10-15 minutos antes "
            "del horario habitual de viaje por posibles retrasos en el tráfico. "
            "Recuerda llevar paraguas."
        )
    else:
        recommendation = (
            "El clima es favorable. Envía un mensaje breve y positivo "
            "deseando un buen viaje."
        )

    return (
        f"Ciudad: {subscription.city_name}\n"
        f"Horario habitual de viaje del usuario: {travel_time}\n"
        f"Bloque de pronóstico usado (hora local de la ciudad): {forecast_time}\n"
        f"Nota: OpenWeatherMap puede devolver el bloque horario más cercano, no necesariamente la hora exacta.\n"
        f"Temperatura prevista: {forecast.temperature_c}°C (sensación {forecast.feels_like_c}°C)\n"
        f"Probabilidad de lluvia: {forecast.rain_probability}%\n"
        f"Condición general: {forecast.condition} ({forecast.description})\n"
        f"Umbral de lluvia: {rain_threshold}%\n"
        f"¿Lluvia significativa?: {'Sí' if is_rainy else 'No'}\n\n"
        f"Instrucciones: {recommendation}\n\n"
        "Ejemplo si llueve: "
        "'🌧️ Hoy lloverá (80% probabilidad). Temperatura: 18°C. "
        "Te recomendamos salir 15 minutos antes. ¡No olvides tu paraguas!'\n"
        "Ejemplo si está despejado: "
        "'☀️ Clima favorable hoy. Temperatura: 22°C. ¡Buen viaje!'"
    )
