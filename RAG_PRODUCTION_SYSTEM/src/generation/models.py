from dataclasses import dataclass


@dataclass(frozen=True)
class CitationCandidate:
    number: int
    document_id: str
    document_name: str
    page_number: int | None
    chunk_id: str
    snippet: str


@dataclass(frozen=True)
class PromptPackage:
    system_prompt: str
    user_prompt: str
    citations: list[CitationCandidate]


@dataclass(frozen=True)
class GeneratedAnswer:
    text: str
    used_citation_numbers: tuple[int, ...]
