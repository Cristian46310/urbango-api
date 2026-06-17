import psycopg2
from psycopg2.extensions import connection
from psycopg2.extras import RealDictCursor

from app.config.settings import settings


def get_connection() -> connection:
    return psycopg2.connect(settings.DATABASE_URL, cursor_factory=RealDictCursor)


def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
