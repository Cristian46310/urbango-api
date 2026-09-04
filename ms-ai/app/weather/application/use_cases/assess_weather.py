from app.weather.application.helpers.weather_risk import compute_weather_risk
from app.weather.domain.entities.weather_assessment import WeatherAssessment
from app.weather.domain.ports.iweather_interpreter import IWeatherInterpreter
from app.weather.domain.ports.iweather_provider import IWeatherProvider


class AssessWeatherUseCase:
    def __init__(
        self,
        weather_provider: IWeatherProvider,
        interpreter: IWeatherInterpreter,
    ) -> None:
        self.weather_provider = weather_provider
        self.interpreter = interpreter

    def execute(
        self,
        lat: float,
        lon: float,
        travel_hour: int | None = None,
    ) -> WeatherAssessment:
        hour = travel_hour if travel_hour is not None else 7
        if hour < 0 or hour > 23:
            raise ValueError("travel_hour must be between 0 and 23")

        forecast = self.weather_provider.get_daily_forecast(lat, lon, hour)
        risk_level = compute_weather_risk(forecast)
        explanation, recommendation = self.interpreter.compose(
            forecast,
            risk_level,
            lat=lat,
            lon=lon,
        )
        return WeatherAssessment(
            lat=lat,
            lon=lon,
            metrics=forecast,
            risk_level=risk_level,
            explanation=explanation,
            recommendation=recommendation,
        )
