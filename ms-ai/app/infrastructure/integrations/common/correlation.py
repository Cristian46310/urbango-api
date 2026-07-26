"""Correlation-ID context for request tracing across microservices."""

from contextvars import ContextVar
import uuid

CORRELATION_HEADER = "X-Correlation-Id"

_correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)


def get_correlation_id() -> str | None:
    return _correlation_id.get()


def set_correlation_id(value: str | None) -> None:
    _correlation_id.set(value)


def ensure_correlation_id(incoming: str | None = None) -> str:
    value = (incoming or "").strip() or str(uuid.uuid4())
    set_correlation_id(value)
    return value
