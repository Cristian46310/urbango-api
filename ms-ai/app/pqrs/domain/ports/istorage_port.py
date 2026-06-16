from dataclasses import dataclass
from typing import List, Protocol


@dataclass
class UploadFile:
    content: bytes
    original_name: str
    mime_type: str
    size: int


@dataclass
class StoredImage:
    path: str
    public_url: str
    original_name: str
    mime_type: str
    size: int


class IStoragePort(Protocol):
    def upload_many(self, files: List[UploadFile], ticket_number: str) -> List[StoredImage]:
        ...
