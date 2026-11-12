import re
import httpx

from ..observability.models import TokenUsage
from .models import GeneratedAnswer, PromptPackage


class LlmResponseError(RuntimeError):
    pass


def _parse_usage(payload: object) -> TokenUsage | None:
    if not isinstance(payload, dict):
        return None
    usage = payload.get("usage")
    if not isinstance(usage, dict):
        return None
    values = (
        usage.get("prompt_tokens"),
        usage.get("completion_tokens"),
        usage.get("total_tokens"),
    )
    if any(type(value) is not int or value < 0 for value in values):
        return None
    return TokenUsage(*values)


class DeepSeekClient:
    def __init__(
        self, api_key: str, base_url: str = "https://api.deepseek.com", model: str = "deepseek-chat",
        timeout: float = 30.0, http_client: httpx.AsyncClient | None = None,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self.http_client = http_client

    async def generate(self, prompt: PromptPackage) -> GeneratedAnswer:
        if not self.api_key:
            raise LlmResponseError("DeepSeek API key is not configured")
        owns_client = self.http_client is None
        client = self.http_client or httpx.AsyncClient(timeout=self.timeout)
        try:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model, "temperature": 0,
                    "messages": [
                        {"role": "system", "content": prompt.system_prompt},
                        {"role": "user", "content": prompt.user_prompt},
                    ],
                },
            )
            response.raise_for_status()
            payload = response.json()
            text = payload["choices"][0]["message"]["content"].strip()
            if not text:
                raise LlmResponseError("DeepSeek returned an empty response")
            allowed = {citation.number for citation in prompt.citations}
            used = tuple(dict.fromkeys(number for number in map(int, re.findall(r"\[(\d+)]", text)) if number in allowed))
            return GeneratedAnswer(text, used, _parse_usage(payload))
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
            raise LlmResponseError("DeepSeek request failed") from error
        finally:
            if owns_client:
                await client.aclose()
