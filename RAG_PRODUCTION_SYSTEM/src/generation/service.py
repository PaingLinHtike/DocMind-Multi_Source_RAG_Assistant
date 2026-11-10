from dataclasses import dataclass
from collections.abc import Sequence

from ..observability.langsmith import NoOpObserver, NoOpTraceRun, Observer, TraceContext, TraceRun
from .models import CitationCandidate
from .llm_client import LlmResponseError
from .prompt_builder import InsufficientEvidenceError, build_prompt


@dataclass(frozen=True)
class AnswerResult:
    answer: str
    citations: list[CitationCandidate]


class GenerationService:
    def __init__(
        self,
        retriever,
        llm_client,
        context_token_budget: int = 6000,
        observer: Observer | None = None,
        capture_trace_content: bool = False,
    ):
        self.retriever = retriever
        self.llm_client = llm_client
        self.context_token_budget = context_token_budget
        self.observer = observer or NoOpObserver()
        self.capture_trace_content = capture_trace_content

    def _start_run(self, trace_context: TraceContext | None, document_scope_count: int, question: str) -> TraceRun:
        try:
            return self.observer.start_run(
                "rag.answer",
                run_type="chain",
                metadata={
                    "document_scope_count": document_scope_count,
                    "context_token_budget": self.context_token_budget,
                },
                context=trace_context,
                inputs={"question": question} if self.capture_trace_content else {},
            )
        except Exception:
            return NoOpTraceRun()

    @staticmethod
    def _start_child(parent: TraceRun, name: str, metadata: dict) -> TraceRun:
        try:
            return parent.start_child(name, run_type="chain", metadata=metadata)
        except Exception:
            return NoOpTraceRun()

    @staticmethod
    def _end(run: TraceRun, *, outputs: dict | None = None, error_category: str | None = None) -> None:
        try:
            run.end(outputs=outputs, error_category=error_category)
        except Exception:
            pass

    async def answer(
        self,
        question: str,
        user_id: str,
        document_ids: Sequence[str] | None = None,
        trace_context: TraceContext | None = None,
    ) -> AnswerResult:
        document_scope_count = len(document_ids or [])
        parent = self._start_run(trace_context, document_scope_count, question)
        retrieval = self._start_child(parent, "rag.retrieve", {"document_scope_count": document_scope_count})
        try:
            chunks = self.retriever.search(question, user_id, document_ids)
        except Exception:
            self._end(retrieval, error_category="pipeline_error")
            self._end(parent, error_category="pipeline_error")
            raise
        self._end(retrieval, outputs={"retrieved_chunk_count": len(chunks)})

        prompt_run = self._start_child(parent, "rag.prompt", {
            "context_token_budget": self.context_token_budget,
            "context_chunk_count": len(chunks),
        })
        try:
            prompt = build_prompt(question, chunks, self.context_token_budget)
        except InsufficientEvidenceError:
            answer = "The available documents do not contain enough information to answer this question."
            self._end(prompt_run, outputs={"status": "insufficient_evidence", "context_chunk_count": len(chunks)})
            parent_outputs = {"status": "insufficient_evidence", "citation_count": 0}
            if self.capture_trace_content:
                parent_outputs["answer"] = answer
            self._end(parent, outputs=parent_outputs)
            return AnswerResult(answer, [])
        except Exception:
            self._end(prompt_run, error_category="pipeline_error")
            self._end(parent, error_category="pipeline_error")
            raise
        self._end(prompt_run, outputs={"status": "completed", "context_chunk_count": len(chunks)})

        deepseek = self._start_child(parent, "rag.deepseek", {"model": self.llm_client.model})
        try:
            generated = await self.llm_client.generate(prompt)
        except LlmResponseError:
            self._end(deepseek, error_category="provider_error")
            self._end(parent, error_category="provider_error")
            raise
        except Exception:
            self._end(deepseek, error_category="pipeline_error")
            self._end(parent, error_category="pipeline_error")
            raise
        used = set(generated.used_citation_numbers)
        citations = [citation for citation in prompt.citations if citation.number in used]
        self._end(deepseek, outputs={"status": "completed", "used_citation_count": len(used)})
        parent_outputs = {"status": "completed", "citation_count": len(citations)}
        if self.capture_trace_content:
            parent_outputs["answer"] = generated.text
        self._end(parent, outputs=parent_outputs)
        return AnswerResult(generated.text, citations)
