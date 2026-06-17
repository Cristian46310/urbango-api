from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.pqrs.application.use_cases.create_pqrs import CreatePqrsUseCase
from app.pqrs.application.use_cases.delete_pqrs import DeletePqrsUseCase
from app.pqrs.application.use_cases.get_pqrs_by_id import GetPqrsByIdUseCase
from app.pqrs.application.use_cases.get_pqrs_by_ticket_number import GetPqrsByTicketNumberUseCase
from app.pqrs.application.use_cases.list_pqrs import ListPqrsUseCase
from app.pqrs.application.use_cases.update_pqrs import UpdatePqrsUseCase
from app.pqrs.domain.entities.pqrs import PqrsCategory, PqrsStatus
from app.pqrs.presentation.injection import (
    get_create_pqrs,
    get_delete_pqrs,
    get_list_pqrs,
    get_pqrs_by_id,
    get_pqrs_by_ticket_number,
    get_update_pqrs,
)
from app.pqrs.presentation.mappers.image_mapper import base64_images_to_upload_files
from app.pqrs.presentation.mappers.pqrs_mapper import dto_to_response
from app.pqrs.presentation.schemas.pqrs_schema import CreatePqrsRequest, PqrsResponse, UpdatePqrsRequest

router = APIRouter(prefix="/api/pqrs", tags=["PQRS"])


@router.post("", response_model=PqrsResponse, status_code=status.HTTP_201_CREATED)
def create_pqrs(
    body: CreatePqrsRequest,
    use_case: CreatePqrsUseCase = Depends(get_create_pqrs),
):
    try:
        files = base64_images_to_upload_files(body.images) if body.images else None
        dto = use_case.execute(
            type=body.type,
            category=body.category,
            description=body.description,
            user_email=body.user_email,
            user_id=body.user_id,
            files=files,
        )
        return dto_to_response(dto)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/ticket/{ticket_number}", response_model=PqrsResponse)
def get_pqrs_by_ticket(
    ticket_number: str,
    use_case: GetPqrsByTicketNumberUseCase = Depends(get_pqrs_by_ticket_number),
):
    try:
        return dto_to_response(use_case.execute(ticket_number))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("", response_model=List[PqrsResponse])
def list_pqrs(
    status_filter: Optional[PqrsStatus] = Query(default=None, alias="status"),
    category: Optional[PqrsCategory] = Query(default=None),
    user_email: Optional[str] = Query(default=None),
    use_case: ListPqrsUseCase = Depends(get_list_pqrs),
):
    return [dto_to_response(dto) for dto in use_case.execute(status_filter, category, user_email)]


@router.get("/{pqrs_id}", response_model=PqrsResponse)
def get_pqrs(
    pqrs_id: str,
    use_case: GetPqrsByIdUseCase = Depends(get_pqrs_by_id),
):
    try:
        return dto_to_response(use_case.execute(pqrs_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.put("/{pqrs_id}", response_model=PqrsResponse)
def update_pqrs(
    pqrs_id: str,
    body: UpdatePqrsRequest,
    use_case: UpdatePqrsUseCase = Depends(get_update_pqrs),
):
    try:
        dto = use_case.execute(
            pqrs_id=pqrs_id,
            type=body.type,
            category=body.category,
            description=body.description,
            user_email=body.user_email,
        )
        return dto_to_response(dto)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/{pqrs_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pqrs(
    pqrs_id: str,
    use_case: DeletePqrsUseCase = Depends(get_delete_pqrs),
):
    try:
        use_case.execute(pqrs_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
