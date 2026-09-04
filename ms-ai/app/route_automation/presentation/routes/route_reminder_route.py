from fastapi import APIRouter, Depends, HTTPException, status

from app.infrastructure.integrations.common.http_errors import (
    IntegrationError,
    IntegrationNotFound,
    IntegrationTimeout,
    IntegrationUnauthorized,
    IntegrationUnavailable,
)
from app.route_automation.application.use_cases.cancel_route_reminder import (
    CancelRouteReminderUseCase,
)
from app.route_automation.application.use_cases.create_route_reminder import (
    CreateRouteReminderUseCase,
)
from app.route_automation.presentation.injection import (
    get_cancel_route_reminder,
    get_create_route_reminder,
)
from app.route_automation.presentation.schemas.route_reminder_schema import (
    CreateRouteReminderRequest,
    RouteReminderResponse,
)

router = APIRouter(prefix="/api/automation", tags=["Route Automation"])


@router.post(
    "/route-reminders",
    response_model=RouteReminderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_route_reminder(
    body: CreateRouteReminderRequest,
    use_case: CreateRouteReminderUseCase = Depends(get_create_route_reminder),
):
    try:
        result = use_case.execute(
            business_schedule_id=body.business_schedule_id,
            user_id=body.user_id,
            user_email=body.user_email,
        )
        return RouteReminderResponse(**result)
    except IntegrationNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    except IntegrationUnauthorized:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unauthorized against ms-business (check internal key)",
        )
    except (IntegrationTimeout, IntegrationUnavailable):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ms-business unavailable",
        )
    except IntegrationError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    except ValueError as exc:
        detail = str(exc)
        code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in detail.lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=code, detail=detail)


@router.delete("/route-reminders/{reminder_id}", response_model=RouteReminderResponse)
def cancel_route_reminder(
    reminder_id: str,
    use_case: CancelRouteReminderUseCase = Depends(get_cancel_route_reminder),
):
    try:
        result = use_case.execute(reminder_id)
        return RouteReminderResponse(
            reminder_id=result["reminder_id"],
            sync_status=result["sync_status"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
