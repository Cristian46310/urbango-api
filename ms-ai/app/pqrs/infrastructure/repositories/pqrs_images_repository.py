from typing import Any, List

import psycopg2.extensions

from app.pqrs.domain.entities.pqrs_images import PqrsImages
from app.pqrs.domain.ports.ipqrs_images_repository import IPqrsImagesRepository


def _row_to_entity(row: dict[str, Any]) -> PqrsImages:
    return PqrsImages(
        id=str(row["id"]),
        pqrs_id=str(row["pqrs_id"]),
        image_url=row["image_url"],
        original_name=row.get("original_name") or "",
        mime_type=row.get("mime_type") or "",
        size=row.get("size") or 0,
    )


class PqrsImagesRepository(IPqrsImagesRepository):
    def __init__(self, conn: psycopg2.extensions.connection) -> None:
        self.conn = conn

    def create_image(self, image: PqrsImages) -> PqrsImages:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO pqrs_images (id, pqrs_id, image_url, original_name, mime_type, size)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    image.id,
                    image.pqrs_id,
                    image.image_url,
                    image.original_name,
                    image.mime_type,
                    image.size,
                ),
            )
            row = cur.fetchone()
        return _row_to_entity(row)

    def create_many(self, images: List[PqrsImages]) -> List[PqrsImages]:
        return [self.create_image(image) for image in images]

    def list_by_pqrs_id(self, pqrs_id: str) -> List[PqrsImages]:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM pqrs_images WHERE pqrs_id = %s ORDER BY original_name ASC",
                (pqrs_id,),
            )
            rows = cur.fetchall()
        return [_row_to_entity(row) for row in rows]

    def delete_by_pqrs_id(self, pqrs_id: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM pqrs_images WHERE pqrs_id = %s", (pqrs_id,))
