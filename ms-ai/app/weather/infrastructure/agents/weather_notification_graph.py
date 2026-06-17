import logging
import re
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.config.settings import settings
from app.pqrs.domain.ports.illm_provider import ILLMProvider
from app.pqrs.infrastructure.clients.llm_providers import FallbackLLMProvider
from app.scheduler.infrastructure.clients.notification_client import HttpNotificationClient
from app.weather.domain.entities.weather_forecast import WeatherForecast
from app.weather.domain.entities.notification_channel import NotificationChannel
from app.weather.domain.entities.weather_notification import WeatherNotification
from app.weather.infrastructure.agents.weather_prompts import (
    WEATHER_EMAIL_SYSTEM,
    build_weather_alert_prompt,
)
from app.weather.infrastructure.clients.email_channel_client import EmailChannelClient
from app.weather.infrastructure.clients.push_client import PushChannelClient
from app.weather.infrastructure.clients.whatsapp_client import WhatsAppChannelClient

logger = logging.getLogger(__name__)


class ComposedMessage(TypedDict):
    subject: str
    message: str


class WeatherNotificationState(TypedDict, total=False):
    subscription: WeatherNotification
    forecast: WeatherForecast
    composed: ComposedMessage


def _parse_weather_response(raw: str, default_subject: str) -> ComposedMessage:
    subject_match = re.search(r"^ASUNTO:\s*(.+)$", raw, re.MULTILINE | re.IGNORECASE)
    message_match = re.search(r"^MENSAJE:\s*\n([\s\S]+)$", raw, re.MULTILINE | re.IGNORECASE)
    subject = subject_match.group(1).strip() if subject_match else default_subject
    message = message_match.group(1).strip() if message_match else raw.strip()
    return {"subject": subject, "message": message}


class LangGraphWeatherNotificationOrchestrator:
    def __init__(
        self,
        llm_provider: ILLMProvider | None = None,
        email_channel: EmailChannelClient | None = None,
        whatsapp_channel: WhatsAppChannelClient | None = None,
        push_channel: PushChannelClient | None = None,
    ) -> None:
        self.llm = llm_provider or FallbackLLMProvider()
        self.email_channel = email_channel or EmailChannelClient()
        self.whatsapp_channel = whatsapp_channel or WhatsAppChannelClient()
        self.push_channel = push_channel or PushChannelClient()
        self.graph = self._build_graph()

    def notify_weather_alert(
        self,
        subscription: WeatherNotification,
        forecast: WeatherForecast,
    ) -> None:
        state: WeatherNotificationState = {
            "subscription": subscription,
            "forecast": forecast,
        }
        self._run_graph(state)

    def _run_graph(self, state: WeatherNotificationState) -> None:
        try:
            self.graph.invoke(state)
        except Exception as exc:
            logger.warning("Weather notification graph failed: %s", exc)

    def _build_graph(self):
        graph = StateGraph(WeatherNotificationState)
        graph.add_node("compose_message", self._compose_message)
        graph.add_node("dispatch", self._dispatch)
        graph.set_entry_point("compose_message")
        graph.add_edge("compose_message", "dispatch")
        graph.add_edge("dispatch", END)
        return graph.compile()

    def _compose_message(self, state: WeatherNotificationState) -> WeatherNotificationState:
        subscription = state["subscription"]
        forecast = state["forecast"]
        prompt = build_weather_alert_prompt(
            subscription,
            forecast,
            settings.WEATHER_RAIN_THRESHOLD_PERCENT,
        )
        raw = self.llm.generate(WEATHER_EMAIL_SYSTEM, prompt)
        composed = _parse_weather_response(raw, "Alerta de clima para tu viaje")
        state["composed"] = composed
        return state

    def _dispatch(self, state: WeatherNotificationState) -> WeatherNotificationState:
        subscription = state["subscription"]
        composed = state.get("composed")
        if not composed:
            return state

        recipient = subscription.user_email
        subject = composed["subject"]
        message = composed["message"]
        channel = subscription.preferred_channel

        if channel == NotificationChannel.EMAIL:
            self.email_channel.send(recipient, subject, message)
        elif channel == NotificationChannel.WHATSAPP:
            self.whatsapp_channel.send(recipient, subject, message)
        elif channel == NotificationChannel.PUSH:
            self.push_channel.send(recipient, subject, message)
        else:
            HttpNotificationClient._post_email(to=recipient, subject=subject, body=message)
        return state
