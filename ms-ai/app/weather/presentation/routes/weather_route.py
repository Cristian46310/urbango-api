from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.weather.application.use_cases.create_weather_alert import CreateWeatherAlertUseCase
from app.weather.application.use_cases.deactivate_weather_alert import DeactivateWeatherAlertUseCase
from app.weather.application.use_cases.get_weather_alert import GetWeatherAlertUseCase
from app.weather.application.use_cases.list_weather_alerts_by_user import ListWeatherAlertsByUserUseCase
from app.weather.application.use_cases.update_weather_alert import UpdateWeatherAlertUseCase
from app.weather.presentation.injection import (
    get_create_weather_alert,
    get_deactivate_weather_alert,
    get_list_weather_alerts_by_user,
    get_update_weather_alert,
    get_weather_alert,
)
from app.weather.presentation.mappers.weather_mapper import dto_to_response
from app.weather.presentation.schemas.weather_schema import (
    CreateWeatherAlertRequest,
    UpdateWeatherAlertRequest,
    WeatherAlertResponse,
)

router = APIRouter(prefix="/api/weather/alerts", tags=["Weather Alerts"])


@router.post("", response_model=WeatherAlertResponse, status_code=status.HTTP_201_CREATED)
def create_weather_alert(
    body: CreateWeatherAlertRequest,
    use_case: CreateWeatherAlertUseCase = Depends(get_create_weather_alert),
):
    """Crea una alerta de clima para un horario de viaje."""
    try:
        dto = use_case.execute(
            user_id=body.user_id,
            user_email=body.user_email,
            travel_hour=body.travel_hour,
            city_name=body.city_name,
            preferred_channel=body.preferred_channel,
        )
        return dto_to_response(dto)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/user/{user_id}", response_model=List[WeatherAlertResponse])
def list_weather_alerts_by_user(
    user_id: str,
    use_case: ListWeatherAlertsByUserUseCase = Depends(get_list_weather_alerts_by_user),
):
    """Lista todas las alertas de clima de un usuario."""
    return [dto_to_response(dto) for dto in use_case.execute(user_id)]


@router.get("/{alert_id}", response_model=WeatherAlertResponse)
def get_weather_alert(
    alert_id: str,
    use_case: GetWeatherAlertUseCase = Depends(get_weather_alert),
):
    """Consulta una alerta de clima por su id."""
    dto = use_case.execute(alert_id)
    if not dto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weather alert not found")
    return dto_to_response(dto)


@router.put("/{alert_id}", response_model=WeatherAlertResponse)
def update_weather_alert(
    alert_id: str,
    body: UpdateWeatherAlertRequest,
    use_case: UpdateWeatherAlertUseCase = Depends(get_update_weather_alert),
):
    """Actualiza una alerta de clima por su id."""
    try:
        dto = use_case.execute(
            alert_id=alert_id,
            user_email=body.user_email,
            travel_hour=body.travel_hour,
            city_name=body.city_name,
            preferred_channel=body.preferred_channel,
        )
        return dto_to_response(dto)
    except ValueError as exc:
        message = str(exc)
        if "not found" in message:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_weather_alert(
    alert_id: str,
    use_case: DeactivateWeatherAlertUseCase = Depends(get_deactivate_weather_alert),
):
    """Desactiva una alerta de clima por su id."""
    deactivated = use_case.execute(alert_id)
    if not deactivated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weather alert not found")
