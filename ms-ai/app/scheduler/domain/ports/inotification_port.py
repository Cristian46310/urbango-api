from typing import Protocol
from app.scheduler.domain.entities.appoitment import Appointment


class INotificationPort(Protocol):
    def send_confirmation(self, appointment: Appointment) -> None: ...
    def send_cancellation(self, appointment: Appointment) -> None: ...
