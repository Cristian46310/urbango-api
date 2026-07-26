from pydantic import BaseModel, Field


class WeatherForecast(BaseModel):
    temperature_c: float = Field(default=0.0)
    feels_like_c: float = Field(default=0.0)
    humidity_percent: int = Field(default=0, ge=0, le=100)
    wind_speed_ms: float = Field(default=0.0, ge=0)
    rain_probability: int = Field(default=0, ge=0, le=100)
    condition: str = Field(default="")
    description: str = Field(default="")
    matched_local_time: str = Field(
        default="",
        description="Hora local del bloque de pronóstico devuelto por la API (puede ser aproximada)",
    )
    requested_travel_hour: int = Field(default=0, ge=0, le=23)

