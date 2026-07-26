"""Shared httpx helpers: timeouts, GET retries, Correlation-ID / Internal-Key headers."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.infrastructure.integrations.common.correlation import (
    CORRELATION_HEADER,
    get_correlation_id,
)
from app.infrastructure.integrations.common.http_errors import (
    IntegrationClientError,
    IntegrationNotFound,
    IntegrationTimeout,
    IntegrationUnauthorized,
    IntegrationUnavailable,
)

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 15.0
DEFAULT_GET_RETRIES = 2
DEFAULT_BACKOFF_SECONDS = 0.25


def build_headers(
    *,
    internal_key: str | None = None,
    extra: dict[str, str] | None = None,
) -> dict[str, str]:
    headers: dict[str, str] = {"Accept": "application/json"}
    cid = get_correlation_id()
    if cid:
        headers[CORRELATION_HEADER] = cid
    if internal_key:
        headers["X-Internal-Key"] = internal_key
    if extra:
        headers.update(extra)
    return headers


def raise_for_integration_status(
    response: httpx.Response,
    *,
    dependency: str,
) -> None:
    code = response.status_code
    if 200 <= code < 300:
        return
    body_preview = (response.text or "")[:300]
    message = f"{dependency} HTTP {code}: {body_preview}"
    if code == 404:
        raise IntegrationNotFound(message, dependency=dependency, status_code=code)
    if code in (401, 403):
        raise IntegrationUnauthorized(message, dependency=dependency, status_code=code)
    if code >= 500:
        raise IntegrationUnavailable(message, dependency=dependency, status_code=code)
    raise IntegrationClientError(message, dependency=dependency, status_code=code)


def get_json(
    url: str,
    *,
    dependency: str,
    params: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    timeout: float = DEFAULT_TIMEOUT,
    retries: int = DEFAULT_GET_RETRIES,
) -> Any:
    """Idempotent GET with bounded retries on timeout / 5xx."""
    last_exc: Exception | None = None
    attempts = max(1, retries + 1)

    for attempt in range(attempts):
        started = time.perf_counter()
        try:
            response = httpx.get(url, params=params, headers=headers, timeout=timeout)
            latency_ms = int((time.perf_counter() - started) * 1000)
            logger.info(
                "integration_get dependency=%s status=%s latency_ms=%s attempt=%s url=%s",
                dependency,
                response.status_code,
                latency_ms,
                attempt + 1,
                url,
                extra={
                    "dependency": dependency,
                    "status_code": response.status_code,
                    "latency_ms": latency_ms,
                    "correlation_id": get_correlation_id(),
                },
            )
            if response.status_code >= 500 and attempt < attempts - 1:
                time.sleep(DEFAULT_BACKOFF_SECONDS * (attempt + 1))
                continue
            raise_for_integration_status(response, dependency=dependency)
            return response.json()
        except httpx.TimeoutException as exc:
            last_exc = IntegrationTimeout(
                f"{dependency} timeout: {exc}",
                dependency=dependency,
            )
            if attempt < attempts - 1:
                time.sleep(DEFAULT_BACKOFF_SECONDS * (attempt + 1))
                continue
            raise last_exc from exc
        except httpx.TransportError as exc:
            last_exc = IntegrationTimeout(
                f"{dependency} connection error: {exc}",
                dependency=dependency,
            )
            if attempt < attempts - 1:
                time.sleep(DEFAULT_BACKOFF_SECONDS * (attempt + 1))
                continue
            raise last_exc from exc
        except IntegrationUnavailable as exc:
            last_exc = exc
            if attempt < attempts - 1:
                time.sleep(DEFAULT_BACKOFF_SECONDS * (attempt + 1))
                continue
            raise

    if last_exc:
        raise last_exc
    raise IntegrationUnavailable(f"{dependency} request failed", dependency=dependency)
