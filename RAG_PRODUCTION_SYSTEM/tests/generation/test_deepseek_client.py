import asyncio
import httpx

from RAG_PRODUCTION_SYSTEM.src.generation.llm_client import DeepSeekClient
from RAG_PRODUCTION_SYSTEM.src.generation.models import CitationCandidate, PromptPackage


def test_deepseek_client_returns_valid_citations_only():
    def handler(request):
        assert request.headers["Authorization"] == "Bearer secret"
        return httpx.Response(200, json={"choices": [{"message": {"content": "Answer [1] [9]"}}]})
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    prompt = PromptPackage("system", "user", [CitationCandidate(1, "d", "a.txt", 1, "c", "snippet")])
    result = asyncio.run(DeepSeekClient("secret", http_client=client).generate(prompt))
    assert result.text == "Answer [1] [9]"
    assert result.used_citation_numbers == (1,)
    asyncio.run(client.aclose())
