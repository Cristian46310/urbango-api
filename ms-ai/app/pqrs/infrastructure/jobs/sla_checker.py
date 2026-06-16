import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config.settings import settings
from app.pqrs.infrastructure.agents.notification_graph import LangGraphNotificationOrchestrator
from app.pqrs.infrastructure.repositories.pqrs_repository import PqrsRepository
from app.scheduler.infrastructure.database import get_connection

logger = logging.getLogger(__name__)


async def _run_sla_check() -> None:
    conn = None
    try:
        conn = get_connection()
        repo = PqrsRepository(conn)
        orchestrator = LangGraphNotificationOrchestrator()
        overdue = repo.list_overdue_pqrs()
        for pqrs in overdue:
            try:
                orchestrator.notify_sla_breach(pqrs)
                repo.mark_sla_alert_sent(pqrs.id)
                conn.commit()
            except Exception as exc:
                logger.warning("SLA alert failed for %s: %s", pqrs.ticket_number, exc)
                conn.rollback()
    except Exception as exc:
        logger.warning("SLA checker failed: %s", exc)
    finally:
        if conn:
            conn.close()


async def _sla_loop() -> None:
    while True:
        await _run_sla_check()
        await asyncio.sleep(settings.SLA_CHECK_INTERVAL_SECONDS)


@asynccontextmanager
async def pqrs_lifespan(app: FastAPI):
    task = asyncio.create_task(_sla_loop())
    logger.info("PQRS SLA checker started (interval=%ss)", settings.SLA_CHECK_INTERVAL_SECONDS)
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        logger.info("PQRS SLA checker stopped")
