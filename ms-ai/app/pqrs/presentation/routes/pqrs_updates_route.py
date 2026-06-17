from fastapi import APIRouter, Depends, HTTPException, status

from app.pqrs.application.use_cases.create_pqrs_update import CreatePqrsUpdateUseCase
from app.pqrs.application.use_cases.get_pqrs_update_by_id import GetPqrsUpdateByIdUseCase
from app.pqrs.application.use_cases.list_pqrs_updates import ListPqrsUpdatesUseCase
from app.pqrs.presentation.injection import (
    get_create_pqrs_update,
    get_list_pqrs_updates,
    get_pqrs_update_by_id,
)
from app.pqrs.presentation.mappers.pqrs_mapper import update_dto_to_response
from app.pqrs.presentation.schemas.pqrs_schema import CreatePqrsUpdateRequest, PqrsUpdateResponse

router = APIRouter(prefix="/api/pqrs/{pqrs_id}/updates", tags=["PQRS Updates"])


@router.post("", response_model=PqrsUpdateResponse, status_code=status.HTTP_201_CREATED)
def create_pqrs_update(
    pqrs_id: str,
    body: CreatePqrsUpdateRequest,
    use_case: CreatePqrsUpdateUseCase = Depends(get_create_pqrs_update),
):
    try:
        dto = use_case.execute(
            pqrs_id=pqrs_id,
            status_to=body.status_to,
            description=body.description,
            agent_response=body.agent_response,
            action=body.action,
        )
        return update_dto_to_response(dto)
    except ValueError as exc:
        status_code = status.HTTP_400_BAD_REQUEST
        if "not found" in str(exc).lower():
            status_code = status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=str(exc))


@router.get("", response_model=list[PqrsUpdateResponse])
def list_pqrs_updates(
    pqrs_id: str,
    use_case: ListPqrsUpdatesUseCase = Depends(get_list_pqrs_updates),
):
    return [update_dto_to_response(dto) for dto in use_case.execute(pqrs_id)]


@router.get("/{update_id}", response_model=PqrsUpdateResponse)
def get_pqrs_update(
    pqrs_id: str,
    update_id: str,
    use_case: GetPqrsUpdateByIdUseCase = Depends(get_pqrs_update_by_id),
):
    try:
        dto = use_case.execute(update_id)
        if dto.pqrs_id != pqrs_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Update not found for this PQRS")
        return update_dto_to_response(dto)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
