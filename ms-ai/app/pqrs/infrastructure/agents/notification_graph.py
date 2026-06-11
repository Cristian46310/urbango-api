import logging
import re
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.config.settings import settings
from app.pqrs.domain.entities.pqrs import Pqrs
from app.pqrs.domain.entities.pqrs_images import PqrsImages
from app.pqrs.domain.entities.pqrs_updates import PqrsUpdates
from app.pqrs.domain.ports.illm_provider import ILLMProvider
from app.pqrs.infrastructure.agents.prompts import (
    DEPT_EMAIL_SYSTEM,
    SLA_EMAIL_SYSTEM,
    STATUS_EMAIL_SYSTEM,
    USER_EMAIL_SYSTEM,
    build_dept_email_prompt,
    build_sla_email_prompt,
    build_status_email_prompt,
    build_user_email_prompt,
)
from app.pqrs.infrastructure.clients.llm_providers import FallbackLLMProvider
from app.pqrs.infrastructure.clients.slack_webhook import SlackWebhookClient
from app.pqrs.infrastructure.config.department_routing import get_department_for_category
from app.scheduler.infrastructure.clients.notification_client import HttpNotificationClient

logger = logging.getLogger(__name__)


class EmailMessage(TypedDict):
    to: str
    subject: str
    body: str


class NotificationState(TypedDict, total=False):
    event_type: str
    pqrs: Pqrs
    update: PqrsUpdates
    images: list[PqrsImages]
    dept_email: str
    dept_slack_webhook: str
    supervisor_email: str
    composed_emails: list[EmailMessage]
    slack_message: str


def _parse_email_response(raw: str, default_subject: str) -> EmailMessage:
    subject_match = re.search(r"^ASUNTO:\s*(.+)$", raw, re.MULTILINE | re.IGNORECASE)
    body_match = re.search(r"^CUERPO:\s*\n([\s\S]+)$", raw, re.MULTILINE | re.IGNORECASE)
    subject = subject_match.group(1).strip() if subject_match else default_subject
    body = body_match.group(1).strip() if body_match else raw.strip()
    return {"to": "", "subject": subject, "body": body}


class LangGraphNotificationOrchestrator:
    def __init__(
        self,
        llm_provider: ILLMProvider | None = None,
        email_client: HttpNotificationClient | None = None,
        slack_client: SlackWebhookClient | None = None,
    ) -> None:
        self.llm = llm_provider or FallbackLLMProvider()
        self.email_client = email_client or HttpNotificationClient()
        self.slack_client = slack_client or SlackWebhookClient()
        self.graph = self._build_graph()

    def notify_pqrs_created(self, pqrs: Pqrs, images: list[PqrsImages]) -> None:
        state: NotificationState = {
            "event_type": "pqrs_created",
            "pqrs": pqrs,
            "images": images,
            "composed_emails": [],
        }
        self._run_graph(state)

    def notify_status_change(self, pqrs: Pqrs, update: PqrsUpdates) -> None:
        state: NotificationState = {
            "event_type": "status_changed",
            "pqrs": pqrs,
            "update": update,
            "composed_emails": [],
        }
        self._run_graph(state)

    def notify_sla_breach(self, pqrs: Pqrs) -> None:
        state: NotificationState = {
            "event_type": "sla_breach",
            "pqrs": pqrs,
            "supervisor_email": settings.SUPERVISOR_EMAIL,
            "composed_emails": [],
        }
        self._run_graph(state)

    def _run_graph(self, state: NotificationState) -> None:
        try:
            self.graph.invoke(state)
        except Exception as exc:
            logger.warning("Notification graph failed: %s", exc)

    def _build_graph(self):
        graph = StateGraph(NotificationState)
        graph.add_node("build_context", self._build_context)
        graph.add_node("compose_user_email", self._compose_user_email)
        graph.add_node("compose_dept_email", self._compose_dept_email)
        graph.add_node("compose_status_email", self._compose_status_email)
        graph.add_node("compose_sla_email", self._compose_sla_email)
        graph.add_node("dispatch", self._dispatch)

        graph.set_entry_point("build_context")
        graph.add_conditional_edges(
            "build_context",
            self._route_after_context,
            {
                "created": "compose_user_email",
                "status": "compose_status_email",
                "sla": "compose_sla_email",
            },
        )
        graph.add_edge("compose_user_email", "compose_dept_email")
        graph.add_edge("compose_dept_email", "dispatch")
        graph.add_edge("compose_status_email", "dispatch")
        graph.add_edge("compose_sla_email", "dispatch")
        graph.add_edge("dispatch", END)
        return graph.compile()

    def _route_after_context(self, state: NotificationState) -> str:
        event_type = state.get("event_type", "")
        if event_type == "pqrs_created":
            return "created"
        if event_type == "status_changed":
            return "status"
        return "sla"

    def _build_context(self, state: NotificationState) -> NotificationState:
        pqrs = state["pqrs"]
        dept = get_department_for_category(pqrs.category.value)
        state["dept_email"] = dept.get("email", settings.SUPERVISOR_EMAIL)
        state["dept_slack_webhook"] = dept.get("slack_webhook", "")
        state["supervisor_email"] = settings.SUPERVISOR_EMAIL
        return state

    def _compose_user_email(self, state: NotificationState) -> NotificationState:
        pqrs = state["pqrs"]
        raw = self.llm.generate(USER_EMAIL_SYSTEM, build_user_email_prompt(pqrs))
        email = _parse_email_response(raw, f"Confirmación PQRS {pqrs.ticket_number}")
        email["to"] = pqrs.user_email
        state.setdefault("composed_emails", []).append(email)
        return state

    def _compose_dept_email(self, state: NotificationState) -> NotificationState:
        pqrs = state["pqrs"]
        images = state.get("images", [])
        raw = self.llm.generate(
            DEPT_EMAIL_SYSTEM,
            build_dept_email_prompt(pqrs, images),
        )
        email = _parse_email_response(raw, f"Nuevo PQRS {pqrs.ticket_number}")
        email["to"] = state.get("dept_email", settings.SUPERVISOR_EMAIL)
        state.setdefault("composed_emails", []).append(email)

        image_links = ", ".join(img.image_url for img in images) if images else "Sin imágenes"
        state["slack_message"] = (
            f"Nuevo PQRS {pqrs.ticket_number} | Categoría: {pqrs.category.value} | "
            f"Tipo: {pqrs.type.value} | {pqrs.description[:120]} | Imágenes: {image_links}"
        )
        return state

    def _compose_status_email(self, state: NotificationState) -> NotificationState:
        pqrs = state["pqrs"]
        update = state["update"]
        raw = self.llm.generate(
            STATUS_EMAIL_SYSTEM,
            build_status_email_prompt(pqrs, update),
        )
        email = _parse_email_response(raw, f"Actualización PQRS {pqrs.ticket_number}")
        email["to"] = pqrs.user_email
        state.setdefault("composed_emails", []).append(email)
        return state

    def _compose_sla_email(self, state: NotificationState) -> NotificationState:
        pqrs = state["pqrs"]
        raw = self.llm.generate(SLA_EMAIL_SYSTEM, build_sla_email_prompt(pqrs))
        email = _parse_email_response(raw, f"Alerta SLA PQRS {pqrs.ticket_number}")
        email["to"] = state.get("supervisor_email", settings.SUPERVISOR_EMAIL)
        state.setdefault("composed_emails", []).append(email)
        return state

    def _dispatch(self, state: NotificationState) -> NotificationState:
        for email in state.get("composed_emails", []):
            if not email.get("to"):
                continue
            HttpNotificationClient._post_email(
                to=email["to"],
                subject=email["subject"],
                body=email["body"],
            )

        slack_message = state.get("slack_message")
        webhook = state.get("dept_slack_webhook", "")
        if slack_message and webhook:
            self.slack_client.send_message(webhook, slack_message)
        return state
