import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.infrastructure.integrations.common.correlation import (
    CORRELATION_HEADER,
    ensure_correlation_id,
    set_correlation_id,
)

logger = logging.getLogger(__name__)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        incoming = request.headers.get(CORRELATION_HEADER) or request.headers.get(
            "x-correlation-id"
        )
        correlation_id = ensure_correlation_id(incoming)
        request.state.correlation_id = correlation_id
        try:
            response = await call_next(request)
        finally:
            set_correlation_id(None)
        response.headers[CORRELATION_HEADER] = correlation_id
        return response
