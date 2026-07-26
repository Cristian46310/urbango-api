from fastapi import APIRouter, Depends, HTTPException, status

from app.weather.application.use_cases.assess_weather import AssessWeatherUseCase
from app.weather.domain.entities.weather_assessment import WeatherAssessment
from app.weather.presentation.injection import get_assess_weather
from app.weather.presentation.schemas.weather_assess_schema import (
    AssessWeatherRequest,
    AssessWeatherResponse,
    WeatherMetricsResponse,
)

router = APIRouter(prefix="/api/weather", tags=["Weather Assess"])


def _to_response(assessment: WeatherAssessment) -> AssessWeatherResponse:
    m = assessment.metrics
    return AssessWeatherResponse(
        location={"lat": assessment.lat, "lon": assessment.lon},
        metrics=WeatherMetricsResponse(
            temperature_c=m.temperature_c,
            feels_like_c=m.feels_like_c,
            humidity_percent=m.humidity_percent,
            wind_speed_ms=m.wind_speed_ms,
            rain_probability=m.rain_probability,
            condition=m.condition,
            description=m.description,
            matched_local_time=m.matched_local_time,
            requested_travel_hour=m.requested_travel_hour,
        ),
        risk_level=assessment.risk_level,
        explanation=assessment.explanation,
        recommendation=assessment.recommendation,
    )


@router.post("/assess", response_model=AssessWeatherResponse)
def assess_weather(
    body: AssessWeatherRequest,
    use_case: AssessWeatherUseCase = Depends(get_assess_weather),
):
    """Consulta OpenWeather, calcula riesgo de forma determinista y genera NL con LangGraph."""
    try:
        assessment = use_case.execute(body.lat, body.lon, body.travel_hour)
        return _to_response(assessment)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
