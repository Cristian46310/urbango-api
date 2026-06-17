import logging

import httpx

from app.config.settings import settings
from app.weather.domain.ports.inotification_channel_port import INotificationChannelPort

logger = logging.getLogger(__name__)


class WhatsAppChannelClient(INotificationChannelPort):
    def send(self, recipient: str, subject: str, message: str) -> None:
        payload = {
            "to": recipient,
            "subject": subject,
            "message": message,
            "channel": "whatsapp",
        }
        if settings.WHATSAPP_NOTIFICATION_URL:
            try:
                response = httpx.post(
                    settings.WHATSAPP_NOTIFICATION_URL,
                    json=payload,
                    timeout=10.0,
                )
                response.raise_for_status()
                logger.info("WhatsApp notification sent to %s", recipient)
                return
            except Exception as exc:
                logger.warning("WhatsApp notification failed for %s: %s", recipient, exc)
                return

        logger.info(
            "WhatsApp notification (stub) sent to %s: %s",
            recipient,
            message[:120],
        )
