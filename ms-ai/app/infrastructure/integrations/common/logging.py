import logging
from typing import Any

from app.infrastructure.integrations.common.correlation import get_correlation_id


def structured_extra(**fields: Any) -> dict[str, Any]:
    """Build an `extra` dict for logging with correlation_id when present."""
    payload = {k: v for k, v in fields.items() if v is not None}
    cid = get_correlation_id()
    if cid:
        payload["correlation_id"] = cid
    return payload


def get_integration_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
