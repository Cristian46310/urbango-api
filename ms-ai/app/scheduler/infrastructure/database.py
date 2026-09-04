import psycopg2
from psycopg2.extensions import connection
from psycopg2.extras import RealDictCursor

from app.config.settings import settings


def get_connection() -> connection:
    conn = psycopg2.connect(settings.DATABASE_URL, cursor_factory=RealDictCursor)
    with conn.cursor() as cur:
        cur.execute("SET search_path TO ai, public")
    conn.commit()
    return conn


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
