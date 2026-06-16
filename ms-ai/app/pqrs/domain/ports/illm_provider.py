from typing import Protocol


class ILLMProvider(Protocol):
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        ...
