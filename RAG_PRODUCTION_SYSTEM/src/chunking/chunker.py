from dataclasses import dataclass
from collections.abc import Sequence

from ..ingestion.models import CleanSection


@dataclass(frozen=True)
class DocumentChunk:
    id: str
    text: str
    metadata: dict[str, str | int]


def chunk_sections(
    sections: Sequence[CleanSection], *, user_id: str, document_id: str, filename: str,
    chunk_size: int = 512, overlap: int = 64,
) -> list[DocumentChunk]:
    if chunk_size <= 0 or overlap < 0 or overlap >= chunk_size:
        raise ValueError("Invalid chunk size or overlap")
    chunks: list[DocumentChunk] = []
    for section in sections:
        words = section.text.split()
        start = 0
        while start < len(words):
            text = " ".join(words[start:start + chunk_size])
            index = len(chunks)
            chunks.append(DocumentChunk(
                id=f"{document_id}:{index}:{section.content_hash}",
                text=text,
                metadata={
                    "user_id": user_id, "document_id": document_id, "filename": filename,
                    "page_number": section.page_number or 0, "chunk_index": index,
                    "content_hash": section.content_hash,
                },
            ))
            if start + chunk_size >= len(words):
                break
            start += chunk_size - overlap
    return chunks
