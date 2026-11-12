import asyncio
import httpx
import pytest

from RAG_PRODUCTION_SYSTEM.src.generation.llm_client import DeepSeekClient
from RAG_PRODUCTION_SYSTEM.src.generation.models import CitationCandidate, PromptPackage
from RAG_PRODUCTION_SYSTEM.src.observability import TokenUsage


def generate_from(payload):
    def handler(request):
        assert request.headers["Authorization"] == "Bearer secret"
        return httpx.Response(200, json=payload)

    http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    prompt = PromptPackage("system", "user", [CitationCandidate(1, "d", "a.txt", 1, "c", "snippet")])
    try:
        return asyncio.run(DeepSeekClient("secret", http_client=http_client).generate(prompt))
    finally:
        asyncio.run(http_client.aclose())


def test_deepseek_client_returns_valid_citations_only():
    result = generate_from({"choices": [{"message": {"content": "Answer [1] [9]"}}]})
    assert result.text == "Answer [1] [9]"
    assert result.used_citation_numbers == (1,)


def test_deepseek_client_returns_actual_token_usage():
    result = generate_from({
        "choices": [{"message": {"content": "Answer [1]"}}],
        "usage": {"prompt_tokens": 101, "completion_tokens": 23, "total_tokens": 124},
    })

    assert result.usage == TokenUsage(101, 23, 124)


def test_deepseek_client_preserves_large_actual_token_counts():
    result = generate_from({
        "choices": [{"message": {"content": "Answer [1]"}}],
        "usage": {
            "prompt_tokens": 2_147_483_649,
            "completion_tokens": 2_147_483_650,
            "total_tokens": 4_294_967_299,
        },
    })

    assert result.usage == TokenUsage(2_147_483_649, 2_147_483_650, 4_294_967_299)


@pytest.mark.parametrize("usage", [
    None,
    {"prompt_tokens": 101, "completion_tokens": 23},
    {"prompt_tokens": "101", "completion_tokens": 23, "total_tokens": 124},
    {"prompt_tokens": True, "completion_tokens": 23, "total_tokens": 124},
    {"prompt_tokens": -1, "completion_tokens": 23, "total_tokens": 22},
])
def test_deepseek_client_ignores_missing_or_malformed_usage(usage):
    payload = {"choices": [{"message": {"content": "Answer [1]"}}]}
    if usage is not None:
        payload["usage"] = usage

    result = generate_from(payload)

    assert result.text == "Answer [1]"
    assert result.usage is None


@pytest.mark.parametrize("values", [
    (True, 23, 124),
    (101, False, 124),
    (101, 23, -1),
])
def test_token_usage_rejects_boolean_and_negative_counts(values):
    with pytest.raises(ValueError):
        TokenUsage(*values)
