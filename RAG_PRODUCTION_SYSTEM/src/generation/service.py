from dataclasses import dataclass
from collections.abc import Sequence

from .models import CitationCandidate
from .prompt_builder import InsufficientEvidenceError, build_prompt


@dataclass(frozen=True)
class AnswerResult:
    answer: str
    citations: list[CitationCandidate]


class GenerationService:
    def __init__(self, retriever, llm_client, context_token_budget: int = 6000):
        self.retriever = retriever
        self.llm_client = llm_client
        self.context_token_budget = context_token_budget

    async def answer(self, question: str, user_id: str, document_ids: Sequence[str] | None = None) -> AnswerResult:
        chunks = self.retriever.search(question, user_id, document_ids)
        try:
            prompt = build_prompt(question, chunks, self.context_token_budget)
        except InsufficientEvidenceError:
            return AnswerResult("The available documents do not contain enough information to answer this question.", [])
        generated = await self.llm_client.generate(prompt)
        used = set(generated.used_citation_numbers)
        citations = [citation for citation in prompt.citations if citation.number in used]
        return AnswerResult(generated.text, citations)
