from zoneinfo import ZoneInfo

from app.config.settings import settings
from app.pqrs.domain.entities.pqrs import Pqrs
from app.pqrs.domain.entities.pqrs_images import PqrsImages
from app.pqrs.domain.entities.pqrs_updates import PqrsUpdates

USER_EMAIL_SYSTEM = (
    "Eres un asistente de atención al ciudadano de Sistema Inteligente de Transporte. "
    "Redacta correos claros, empáticos y en español. "
    "Responde EXACTAMENTE con este formato:\n"
    "ASUNTO: <asunto>\n"
    "CUERPO:\n"
    "<cuerpo del correo>"
)

DEPT_EMAIL_SYSTEM = (
    "Eres un asistente interno de Sistema Inteligente de Transporte. "
    "Redacta correos operativos para el departamento responsable en español. "
    "Responde EXACTAMENTE con este formato:\n"
    "ASUNTO: <asunto>\n"
    "CUERPO:\n"
    "<cuerpo del correo>"
)

STATUS_EMAIL_SYSTEM = USER_EMAIL_SYSTEM
SLA_EMAIL_SYSTEM = DEPT_EMAIL_SYSTEM

STATUS_LABELS = {
    "in_review": "En revisión",
    "in_progress": "En proceso",
    "resolved": "Resuelto",
}

TYPE_LABELS = {
    "petition": "Petición",
    "complaint": "Queja",
    "claim": "Reclamo",
    "suggestion": "Sugerencia",
}

CATEGORY_LABELS = {
    "driver": "Conductor",
    "bus": "Bus",
    "route": "Ruta",
    "card": "Tarjeta",
    "other": "Otro",
}


def _format_datetime(value) -> str:
    if not value:
        return "No definido"
    tz = ZoneInfo(settings.TIMEZONE)
    local = value.astimezone(tz) if value.tzinfo else value.replace(tzinfo=tz)
    return local.strftime("%d/%m/%Y %H:%M")


def build_user_email_prompt(pqrs: Pqrs) -> str:
    return (
        f"Redacta el correo de confirmación para un PQRS recién radicado.\n"
        f"Radicado: {pqrs.ticket_number}\n"
        f"Tipo: {TYPE_LABELS.get(pqrs.type.value, pqrs.type.value)}\n"
        f"Categoría: {CATEGORY_LABELS.get(pqrs.category.value, pqrs.category.value)}\n"
        f"Descripción: {pqrs.description}\n"
        f"Tiempo estimado de respuesta: {_format_datetime(pqrs.estimated_response_at)}\n"
        f"Incluye el número de radicado, un resumen breve y el tiempo estimado."
    )


def build_dept_email_prompt(pqrs: Pqrs, images: list[PqrsImages]) -> str:
    image_lines = "\n".join(f"- {img.image_url}" for img in images) if images else "- Sin imágenes"
    return (
        f"Redacta la notificación interna de un nuevo PQRS.\n"
        f"Radicado: {pqrs.ticket_number}\n"
        f"Tipo: {TYPE_LABELS.get(pqrs.type.value, pqrs.type.value)}\n"
        f"Categoría: {CATEGORY_LABELS.get(pqrs.category.value, pqrs.category.value)}\n"
        f"Email ciudadano: {pqrs.user_email}\n"
        f"Descripción: {pqrs.description}\n"
        f"Imágenes:\n{image_lines}\n"
        f"Solicita atención prioritaria según categoría."
    )


def build_status_email_prompt(pqrs: Pqrs, update: PqrsUpdates) -> str:
    status_label = STATUS_LABELS.get(
        update.status_to.value if update.status_to else "",
        update.status_to.value if update.status_to else "Actualizado",
    )
    return (
        f"Redacta el correo de actualización de estado de PQRS al ciudadano.\n"
        f"Radicado: {pqrs.ticket_number}\n"
        f"Nuevo estado: {status_label}\n"
        f"Detalle: {update.description}\n"
        f"Respuesta del agente: {update.agent_response or 'N/A'}\n"
        f"Si el estado es Resuelto, incluye la respuesta final del agente."
    )


def build_sla_email_prompt(pqrs: Pqrs) -> str:
    return (
        f"Redacta una alerta al supervisor por incumplimiento de SLA.\n"
        f"Radicado: {pqrs.ticket_number}\n"
        f"Categoría: {CATEGORY_LABELS.get(pqrs.category.value, pqrs.category.value)}\n"
        f"Estado actual: {pqrs.status.value}\n"
        f"Fecha límite prometida: {_format_datetime(pqrs.estimated_response_at)}\n"
        f"Email ciudadano: {pqrs.user_email}\n"
        f"Descripción: {pqrs.description}\n"
        f"Solicita escalamiento inmediato."
    )
