from datetime import datetime, timedelta

from app.config.settings import settings
from app.pqrs.domain.entities.pqrs import PqrsCategory, PqrsStatus


VALID_STATUS_TRANSITIONS: dict[PqrsStatus, set[PqrsStatus]] = {
    PqrsStatus.RECEIVED: {PqrsStatus.IN_REVIEW},
    PqrsStatus.IN_REVIEW: {PqrsStatus.IN_PROGRESS},
    PqrsStatus.IN_PROGRESS: {PqrsStatus.RESOLVED},
    PqrsStatus.RESOLVED: set(),
}


def validate_status_transition(current: PqrsStatus, target: PqrsStatus) -> None:
    allowed = VALID_STATUS_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise ValueError(f"Invalid status transition from {current.value} to {target.value}")


def calculate_estimated_response_at(category: PqrsCategory, from_date: datetime | None = None) -> datetime:
    start = from_date or datetime.now()
    days = settings.PQRS_SLA_DAYS_BY_CATEGORY.get(category.value, settings.PQRS_DEFAULT_SLA_DAYS)
    business_days = 0
    current = start
    while business_days < days:
        current += timedelta(days=1)
        if current.weekday() < 5:
            business_days += 1
    return current


def validate_email(email: str) -> None:
    if "@" not in email or "." not in email.split("@")[-1]:
        raise ValueError("Invalid email address")
