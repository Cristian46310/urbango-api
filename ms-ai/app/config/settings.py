import json
import os

from dotenv import load_dotenv

load_dotenv()


def _parse_sla_days() -> dict[str, int]:
    raw = os.getenv("PQRS_SLA_DAYS_BY_CATEGORY", "{}")
    try:
        data = json.loads(raw)
        return {str(key): int(value) for key, value in data.items()}
    except (json.JSONDecodeError, ValueError, TypeError):
        defaults = {
            "driver": 5,
            "bus": 5,
            "route": 5,
            "card": 7,
            "other": 5,
            "technical_support": 3,
        }
        return defaults


class Settings:
    PORT: int = int(os.getenv("PORT", "8001"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ms_ai")
    GOOGLE_CALENDAR_ID: str = os.getenv("GOOGLE_CALENDAR_ID", "primary")
    SECRETS_LOCATION: str = os.getenv("SECRETS_LOCATION", "secrets")
    CLIENT_SECRET: str = os.getenv("CLIENT_SECRET", "")
    SCOPES: list[str] = os.getenv("SCOPES", "https://www.googleapis.com/auth/calendar.readonly").split(";")
    MS_NOTIFICATION_URL: str = os.getenv("MS_NOTIFICATION_URL", "http://127.0.0.1:8000/api/email/send")
    MS_BUSINESS_URL: str = os.getenv("MS_BUSINESS_URL", "http://127.0.0.1:3000")
    MS_BUSINESS_INTERNAL_KEY: str = os.getenv("MS_BUSINESS_INTERNAL_KEY", "")
    OFFICE_LOCATION: str = os.getenv("OFFICE_LOCATION", "Oficina UCaldas, Calle 65 #26-10, Manizales")
    BUSINESS_HOUR_START: int = int(os.getenv("BUSINESS_HOUR_START", "8"))
    BUSINESS_HOUR_END: int = int(os.getenv("BUSINESS_HOUR_END", "17"))
    SLOT_DURATION_MINUTES: int = int(os.getenv("SLOT_DURATION_MINUTES", "30"))
    AVAILABILITY_DAYS: int = int(os.getenv("AVAILABILITY_DAYS", "10"))
    TIMEZONE: str = os.getenv("TIMEZONE", "America/Bogota")

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_PQRS_BUCKET: str = os.getenv("SUPABASE_PQRS_BUCKET", "pqrs-images")

    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")
    LLM_TIMEOUT_SECONDS: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))

    SUPERVISOR_EMAIL: str = os.getenv("SUPERVISOR_EMAIL", "supervisor@ucaldas.edu.co")
    SLA_CHECK_INTERVAL_SECONDS: int = int(os.getenv("SLA_CHECK_INTERVAL_SECONDS", "3600"))
    PQRS_DEFAULT_SLA_DAYS: int = int(os.getenv("PQRS_DEFAULT_SLA_DAYS", "5"))
    PQRS_SLA_DAYS_BY_CATEGORY: dict[str, int] = _parse_sla_days()

    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    OPENWEATHER_GEO_URL: str = os.getenv(
        "OPENWEATHER_GEO_URL",
        "https://api.openweathermap.org/geo/1.0/direct",
    )
    OPENWEATHER_FORECAST_URL: str = os.getenv(
        "OPENWEATHER_FORECAST_URL",
        "https://api.openweathermap.org/data/2.5/forecast",
    )
    OPENWEATHER_HOURLY_FORECAST_URL: str = os.getenv(
        "OPENWEATHER_HOURLY_FORECAST_URL",
        "https://api.openweathermap.org/data/2.5/forecast/hourly",
    )
    OPENWEATHER_FORECAST_MODE: str = os.getenv("OPENWEATHER_FORECAST_MODE", "three_hour")
    WEATHER_RAIN_THRESHOLD_PERCENT: int = int(os.getenv("WEATHER_RAIN_THRESHOLD_PERCENT", "50"))
    WEATHER_RAIN_HIGH_THRESHOLD_PERCENT: int = int(os.getenv("WEATHER_RAIN_HIGH_THRESHOLD_PERCENT", "70"))
    WEATHER_ALERT_MAX_HOURS_BEFORE: int = int(os.getenv("WEATHER_ALERT_MAX_HOURS_BEFORE", "2"))
    WEATHER_CHECK_INTERVAL_SECONDS: int = int(os.getenv("WEATHER_CHECK_INTERVAL_SECONDS", "3600"))
    WHATSAPP_NOTIFICATION_URL: str = os.getenv("WHATSAPP_NOTIFICATION_URL", "")
    PUSH_NOTIFICATION_URL: str = os.getenv("PUSH_NOTIFICATION_URL", "")


settings = Settings()

# Ensure technical_support SLA exists even when env JSON omits it
if "technical_support" not in settings.PQRS_SLA_DAYS_BY_CATEGORY:
    settings.PQRS_SLA_DAYS_BY_CATEGORY["technical_support"] = 3
