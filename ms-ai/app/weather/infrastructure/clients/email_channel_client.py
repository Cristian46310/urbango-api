import logging

from app.scheduler.infrastructure.clients.notification_client import HttpNotificationClient
from app.weather.domain.ports.inotification_channel_port import INotificationChannelPort

logger = logging.getLogger(__name__)


class EmailChannelClient(INotificationChannelPort):
    def send(self, recipient: str, subject: str, message: str) -> None:
        HttpNotificationClient._post_email(to=recipient, subject=subject, body=message)
