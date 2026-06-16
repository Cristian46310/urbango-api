from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.scheduler.application.use_cases.create_appointment import CreateAppointmentUseCase
from app.scheduler.application.use_cases.delete_appointment import DeleteAppointmentUseCase
from app.scheduler.application.use_cases.get_all_appointments import GetAllAppointmentsUseCase
from app.scheduler.application.use_cases.get_appointment_by_id import GetAppointmentByIdUseCase
from app.scheduler.application.use_cases.get_appointments_by_user_id import GetAppointmentsByUserIdUseCase
from app.scheduler.application.use_cases.get_available_slots import GetAvailableSlotsUseCase
from app.scheduler.application.use_cases.update_appointment import UpdateAppointmentUseCase
from app.scheduler.presentation.injection import (
    get_all_appointments,
    get_appointment_by_id,
    get_appointments_by_user_id,
    get_available_slots,
    get_create_appointment,
    get_delete_appointment,
    get_update_appointment,
)
from app.scheduler.presentation.mappers.appointment_mapper import dto_to_response, slot_dto_to_response
from app.scheduler.presentation.schemas.appointment_schema import (
    AppointmentResponse,
    AvailabilityResponse,
    CreateAppointmentRequest,
    SlotResponse,
    UpdateAppointmentRequest,
)

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


@router.get("/availability", response_model=AvailabilityResponse)
def get_availability(
    days: int = Query(default=10, ge=1, le=60),
    start_date: Optional[datetime] = Query(default=None),
    use_case: GetAvailableSlotsUseCase = Depends(get_available_slots),
):
    """Retorna los bloques de 30 min disponibles para los próximos `days` días hábiles."""
    slots = use_case.execute(days=days, start_date=start_date)
    return AvailabilityResponse(slots=[slot_dto_to_response(s) for s in slots])


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    body: CreateAppointmentRequest,
    use_case: CreateAppointmentUseCase = Depends(get_create_appointment),
):
    try:
        dto = use_case.execute(
            type=body.type,
            reason=body.reason,
            date_time=body.date_time,
            description=body.description,
            user_id=body.user_id,
            user_email=body.user_email,
        )
        return dto_to_response(dto)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("", response_model=List[AppointmentResponse])
def list_appointments(use_case: GetAllAppointmentsUseCase = Depends(get_all_appointments)):
    return [dto_to_response(dto) for dto in use_case.execute()]


@router.get("/user/{user_id}", response_model=List[AppointmentResponse])
def get_appointments_by_user(
    user_id: str,
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    use_case: GetAppointmentsByUserIdUseCase = Depends(get_appointments_by_user_id),
):
    return [dto_to_response(dto) for dto in use_case.execute(user_id, start_date, end_date)]


@router.get("/{id}", response_model=AppointmentResponse)
def get_appointment(
    id: str,
    use_case: GetAppointmentByIdUseCase = Depends(get_appointment_by_id),
):
    try:
        return dto_to_response(use_case.execute(id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{id}", response_model=AppointmentResponse)
def update_appointment(
    id: str,
    body: UpdateAppointmentRequest,
    use_case: UpdateAppointmentUseCase = Depends(get_update_appointment),
):
    try:
        dto = use_case.execute(
            id=id,
            type=body.type,
            reason=body.reason,
            date_time=body.date_time,
            description=body.description,
        )
        return dto_to_response(dto)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    id: str,
    use_case: DeleteAppointmentUseCase = Depends(get_delete_appointment),
):
    try:
        use_case.execute(id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
