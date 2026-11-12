from dataclasses import dataclass


@dataclass(frozen=True)
class RetrievedChunk:
    text: str
    score: float
    document_id: str
    filename: str
    page_number: int | None
    chunk_id: str
