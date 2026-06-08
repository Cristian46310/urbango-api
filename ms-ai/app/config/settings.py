import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    PORT: int = int(os.getenv("PORT", "8001"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ms_ai")
    GOOGLE_CALENDAR_ID: str = os.getenv("GOOGLE_CALENDAR_ID", "primary")
    SECRETS_LOCATION: str = os.getenv("SECRETS_LOCATION", "secrets")
    CLIENT_SECRET: str = os.getenv("CLIENT_SECRET", "")
    SCOPES: list[str] = os.getenv("SCOPES", "https://www.googleapis.com/auth/calendar.readonly").split(";")
    MS_NOTIFICATION_URL: str = os.getenv("MS_NOTIFICATION_URL", "http://127.0.0.1:8000/api/email/send")
    OFFICE_LOCATION: str = os.getenv("OFFICE_LOCATION", "Oficina UCaldas, Calle 65 #26-10, Manizales")
    BUSINESS_HOUR_START: int = int(os.getenv("BUSINESS_HOUR_START", "8"))
    BUSINESS_HOUR_END: int = int(os.getenv("BUSINESS_HOUR_END", "17"))
    SLOT_DURATION_MINUTES: int = int(os.getenv("SLOT_DURATION_MINUTES", "30"))
    AVAILABILITY_DAYS: int = int(os.getenv("AVAILABILITY_DAYS", "10"))
    TIMEZONE: str = os.getenv("TIMEZONE", "America/Bogota")


settings = Settings()
