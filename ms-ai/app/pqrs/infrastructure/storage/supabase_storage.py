import uuid
from datetime import datetime
from pathlib import Path

import httpx

from app.config.settings import settings
from app.pqrs.domain.ports.istorage_port import IStoragePort, StoredImage, UploadFile


class SupabaseStorageAdapter(IStoragePort):
    ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}

    def upload_many(self, files: list[UploadFile], ticket_number: str) -> list[StoredImage]:
        if not files:
            return []
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("Supabase Storage is not configured for PQRS images")

        return [self._upload(file, ticket_number) for file in files]

    def _upload(self, file: UploadFile, ticket_number: str) -> StoredImage:
        if file.mime_type not in self.ALLOWED_MIME_TYPES:
            raise ValueError(f"Unsupported image type: {file.mime_type}")

        extension = Path(file.original_name).suffix or self._extension_from_mime(file.mime_type)
        date_prefix = datetime.now().strftime("%Y-%m-%d")
        safe_ticket = ticket_number.replace("/", "-")
        path = f"pqrs/{date_prefix}/{safe_ticket}-{uuid.uuid4()}{extension}"

        base_url = settings.SUPABASE_URL.rstrip("/")
        upload_url = f"{base_url}/storage/v1/object/{settings.SUPABASE_PQRS_BUCKET}/{path}"

        response = httpx.post(
            upload_url,
            content=file.content,
            headers={
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": file.mime_type,
                "x-upsert": "false",
            },
            timeout=30.0,
        )
        if response.status_code >= 400:
            raise ValueError(f"Could not upload PQRS image to Supabase: {response.text}")

        public_url = f"{base_url}/storage/v1/object/public/{settings.SUPABASE_PQRS_BUCKET}/{path}"
        return StoredImage(
            path=path,
            public_url=public_url,
            original_name=file.original_name,
            mime_type=file.mime_type,
            size=file.size,
        )

    @staticmethod
    def _extension_from_mime(mime_type: str) -> str:
        subtype = mime_type.split("/")[-1]
        return f".{subtype}" if subtype else ""
