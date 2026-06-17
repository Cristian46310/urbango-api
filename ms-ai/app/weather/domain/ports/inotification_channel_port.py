from typing import Protocol


class INotificationChannelPort(Protocol):
    def send(self, recipient: str, subject: str, message: str) -> None: ...
