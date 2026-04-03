from fastapi import APIRouter, HTTPException, status
from app.DTOs import EmailDTO
from app.DTOs import EmailResponseDTO
from app.services import EmailService

router = APIRouter(prefix="/api/email", tags=["Email"])
email_service = EmailService()


@router.post("/send", response_model=EmailResponseDTO)
async def send_email(email_dto: EmailDTO) -> EmailResponseDTO:
    """
    Envía un correo electrónico con o sin archivos adjuntos.

    - **to**: Email del destinatario
    - **subject**: Asunto del correo
    - **body**: Cuerpo del correo
    - **files**: (Opcional) Lista de rutas de archivos a adjuntar
    """
    result = await email_service.send_email(email_dto)

    if result["success"]:
        return EmailResponseDTO(
            success=True,
            message_id=result.get("message_id"),
            message="Correo enviado exitosamente"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Error desconocido al enviar el correo")
        )


@router.get("/health")
async def health_check():
    """Verifica que el servicio de emails esté funcionando."""
    return {"status": "ok", "service": "email-service"}
