import logging

import httpx

from app.config.settings import settings
from app.pqrs.domain.ports.illm_provider import ILLMProvider

logger = logging.getLogger(__name__)


class OllamaLLMProvider(ILLMProvider):
    def __init__(self, base_url: str | None = None, model: str | None = None) -> None:
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        response = httpx.post(
            f"{self.base_url}/api/chat",
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
            },
            timeout=settings.LLM_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"].strip()


class GeminiLLMProvider(ILLMProvider):
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
            f"?key={self.api_key}"
        )
        response = httpx.post(
            url,
            json={
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            },
            timeout=settings.LLM_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError("Gemini returned no candidates")
        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            raise ValueError("Gemini returned empty content")
        return parts[0]["text"].strip()


class FallbackLLMProvider(ILLMProvider):
    def __init__(self) -> None:
        self.primary = OllamaLLMProvider()
        self.fallback = GeminiLLMProvider()

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        try:
            return self.primary.generate(system_prompt, user_prompt)
        except Exception as exc:
            logger.warning("Ollama failed, falling back to Gemini: %s", exc)
            return self.fallback.generate(system_prompt, user_prompt)
