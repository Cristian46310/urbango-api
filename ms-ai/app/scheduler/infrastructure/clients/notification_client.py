import logging
from zoneinfo import ZoneInfo

import httpx

from app.config.settings import settings
from app.scheduler.domain.entities.appoitment import Appointment, AppointmentType
from app.scheduler.domain.ports.inotification_port import INotificationPort

logger = logging.getLogger(__name__)


class HttpNotificationClient(INotificationPort):
    def send_confirmation(self, appointment: Appointment) -> None:
        tz = ZoneInfo(settings.TIMEZONE)
        dt_local = appointment.date_time.astimezone(tz)
        date_str = dt_local.strftime("%d/%m/%Y %H:%M")

        if appointment.type == AppointmentType.VIRTUAL:
            location_label = f"Enlace Google Meet: {appointment.location}"
        else:
            location_label = f"Ubicación: {appointment.location}"

        body = (
            f"Hola,\n\n"
            f"Tu cita ha sido agendada exitosamente.\n\n"
            f"Fecha y hora: {date_str} (hora Colombia)\n"
            f"Tipo: {'Virtual (videollamada)' if appointment.type == AppointmentType.VIRTUAL else 'Presencial'}\n"
            f"Motivo: {appointment.reason.value.replace('_', ' ').title()}\n"
            f"{location_label}\n\n"
        )

        self._post_email(
            to=appointment.user_email,
            subject="Confirmación de cita",
            body=body,
        )

    def send_cancellation(self, appointment: Appointment) -> None:
        tz = ZoneInfo(settings.TIMEZONE)
        dt_local = appointment.date_time.astimezone(tz)
        date_str = dt_local.strftime("%d/%m/%Y %H:%M")

        body = (
            f"Hola,\n\n"
            f"Tu cita del {date_str} (hora Colombia) ha sido cancelada.\n\n"
            f"Si necesitas agendar una nueva cita, puedes hacerlo en cualquier momento.\n\n"
        )

        self._post_email(
            to=appointment.user_email,
            subject="Cancelación de cita",
            body=body,
        )

    @staticmethod
    def _post_email(to: str, subject: str, body: str) -> None:
        try:
            response = httpx.post(
                settings.MS_NOTIFICATION_URL,
                json={"to": to, "subject": subject, "body": body},
                timeout=10.0,
            )
            response.raise_for_status()
        except Exception as exc:
            logger.warning("Could not send notification email: %s", exc)
