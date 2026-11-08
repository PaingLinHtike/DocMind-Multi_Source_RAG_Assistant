from dataclasses import dataclass
from collections.abc import Callable

from ..chunking.chunker import chunk_sections
from ..ingestion.loader import load_document
from ..ingestion.splitter import clean_sections


@dataclass(frozen=True)
class IndexDocumentCommand:
    user_id: str
    document_id: str
    filename: str
    extension: str
    content: bytes


@dataclass(frozen=True)
class IndexResult:
    chunk_count: int
    collection: str
    embedding_model: str


class IndexingService:
    def __init__(self, repository, embedder, chunk_size: int = 512, chunk_overlap: int = 64):
        self.repository = repository
        self.embedder = embedder
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def index(self, command: IndexDocumentCommand, progress: Callable[[str], None] = lambda _: None) -> IndexResult:
        progress("parsing")
        pages = load_document(command.content, command.extension, command.filename)
        progress("preprocessing")
        sections = clean_sections(pages)
        progress("chunking")
        chunks = chunk_sections(
            sections, user_id=command.user_id, document_id=command.document_id, filename=command.filename,
            chunk_size=self.chunk_size, overlap=self.chunk_overlap,
        )
        progress("embedding")
        vectors = self.embedder.embed_passages([chunk.text for chunk in chunks])
        progress("storing")
        count = self.repository.replace_document(command.user_id, command.document_id, chunks, vectors)
        return IndexResult(count, self.repository.collection_name, self.embedder.model_name)
