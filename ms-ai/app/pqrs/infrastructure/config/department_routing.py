import json
import logging
from functools import lru_cache
from pathlib import Path

from app.config.settings import settings

logger = logging.getLogger(__name__)

DEFAULT_ROUTING = {
    "driver": {"email": "conductores@ucaldas.edu.co", "slack_webhook": ""},
    "bus": {"email": "flota@ucaldas.edu.co", "slack_webhook": ""},
    "route": {"email": "rutas@ucaldas.edu.co", "slack_webhook": ""},
    "card": {"email": "tarjeta@ucaldas.edu.co", "slack_webhook": ""},
    "other": {"email": "pqrs@ucaldas.edu.co", "slack_webhook": ""},
}


@lru_cache
def load_department_routing() -> dict[str, dict[str, str]]:
    config_path = Path(__file__).resolve().parent / "department_routing.json"
    if not config_path.exists():
        return DEFAULT_ROUTING
    try:
        with config_path.open("r", encoding="utf-8") as file:
            data = json.load(file)
        merged = DEFAULT_ROUTING.copy()
        merged.update(data)
        return merged
    except Exception as exc:
        logger.warning("Could not load department routing config: %s", exc)
        return DEFAULT_ROUTING


def get_department_for_category(category: str) -> dict[str, str]:
    routing = load_department_routing()
    return routing.get(category, routing["other"])
