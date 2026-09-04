import logging
import re

from app.pqrs.domain.entities.pqrs import PqrsCategory
from app.pqrs.domain.ports.illm_provider import ILLMProvider
from app.pqrs.infrastructure.clients.llm_providers import FallbackLLMProvider

logger = logging.getLogger(__name__)

ALLOWED = {c.value for c in PqrsCategory}

CLASSIFY_SYSTEM = (
    "Clasificas solicitudes PQRS del transporte institucional UCaldas. "
    "Responde SOLO con una de estas categorías exactas (minúsculas):\n"
    + ", ".join(sorted(ALLOWED))
    + "\n"
    "No inventes otras categorías. Si no estás seguro, responde: other"
)


class ClassifyPqrsCategoryUseCase:
    """Suggest category via LLM; always whitelist against PqrsCategory enum."""

    def __init__(self, llm_provider: ILLMProvider | None = None) -> None:
        self.llm = llm_provider or FallbackLLMProvider()

    def execute(self, description: str, pqrs_type: str | None = None) -> PqrsCategory:
        prompt = (
            f"Tipo declarado (opcional): {pqrs_type or 'N/D'}\n"
            f"Descripción del ciudadano:\n{description}\n\n"
            "Categoría:"
        )
        try:
            raw = self.llm.generate(CLASSIFY_SYSTEM, prompt)
            suggested = self._extract_category(raw)
        except Exception as exc:
            logger.warning("PQRS category classification failed: %s", exc)
            return PqrsCategory.OTHER

        if suggested in ALLOWED:
            return PqrsCategory(suggested)
        logger.warning("LLM suggested invalid category %r; falling back to other", suggested)
        return PqrsCategory.OTHER

    @staticmethod
    def _extract_category(raw: str) -> str:
        text = raw.strip().lower()
        # Prefer exact token match
        for value in ALLOWED:
            if re.search(rf"\b{re.escape(value)}\b", text):
                return value
        # First line / word
        first = re.split(r"[\s,.\n]+", text)[0] if text else ""
        return first
