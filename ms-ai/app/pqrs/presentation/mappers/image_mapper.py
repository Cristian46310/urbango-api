import base64
import binascii
import re

from app.pqrs.domain.ports.istorage_port import UploadFile
from app.pqrs.presentation.schemas.pqrs_schema import CreatePqrsImageRequest

_DATA_URL_PREFIX = re.compile(r"^data:[^;]+;base64,", re.IGNORECASE)


def base64_images_to_upload_files(images: list[CreatePqrsImageRequest]) -> list[UploadFile]:
    upload_files: list[UploadFile] = []
    for index, image in enumerate(images, start=1):
        raw = _DATA_URL_PREFIX.sub("", image.content_base64.strip())
        try:
            content = base64.b64decode(raw, validate=True)
        except binascii.Error as exc:
            raise ValueError(f"Invalid base64 in image #{index} ({image.filename})") from exc

        if not content:
            raise ValueError(f"Image #{index} ({image.filename}) is empty")

        upload_files.append(
            UploadFile(
                content=content,
                original_name=image.filename,
                mime_type=image.mime_type,
                size=len(content),
            )
        )
    return upload_files
