"""Typed errors for outbound HTTP integrations (ms-business, OpenWeather, etc.)."""


class IntegrationError(Exception):
    """Base error for external dependency failures."""

    def __init__(self, message: str, *, dependency: str = "", status_code: int | None = None) -> None:
        super().__init__(message)
        self.dependency = dependency
        self.status_code = status_code


class IntegrationNotFound(IntegrationError):
    """Remote resource does not exist (HTTP 404)."""


class IntegrationUnauthorized(IntegrationError):
    """Auth against dependency failed (HTTP 401/403)."""


class IntegrationTimeout(IntegrationError):
    """Timeout or connection failure talking to dependency."""


class IntegrationUnavailable(IntegrationError):
    """Dependency returned 5xx or is otherwise unavailable."""


class IntegrationClientError(IntegrationError):
    """Other 4xx from dependency that should not be retried."""
