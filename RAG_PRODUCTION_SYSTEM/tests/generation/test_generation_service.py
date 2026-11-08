import asyncio

from RAG_PRODUCTION_SYSTEM.src.generation.service import GenerationService


class EmptyRetriever:
    def search(self, *args, **kwargs): return []


class FailingClient:
    async def generate(self, prompt): raise AssertionError("should not call LLM")


def test_no_evidence_returns_deterministic_answer_without_llm():
    result = asyncio.run(GenerationService(EmptyRetriever(), FailingClient()).answer("question", "u1"))
    assert "enough information" in result.answer
    assert result.citations == []
