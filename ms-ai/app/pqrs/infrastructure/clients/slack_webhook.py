import logging

import httpx

logger = logging.getLogger(__name__)


class SlackWebhookClient:
    def send_message(self, webhook_url: str, text: str) -> None:
        if not webhook_url:
            logger.info("Slack webhook not configured; skipping message")
            return
        try:
            response = httpx.post(webhook_url, json={"text": text}, timeout=10.0)
            response.raise_for_status()
        except Exception as exc:
            logger.warning("Could not send Slack notification: %s", exc)
