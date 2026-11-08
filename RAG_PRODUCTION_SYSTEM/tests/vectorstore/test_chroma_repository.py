import chromadb

from RAG_PRODUCTION_SYSTEM.src.chunking.chunker import DocumentChunk
from RAG_PRODUCTION_SYSTEM.src.vectorstore.chroma_repository import ChromaRepository


def test_replace_is_idempotent_and_user_scoped():
    repository = ChromaRepository(chromadb.EphemeralClient(), "test")
    first = DocumentChunk("d:0:a", "alpha", {"user_id": "u1", "document_id": "d", "filename": "a.txt", "page_number": 1, "chunk_index": 0, "content_hash": "a"})
    other = DocumentChunk("other:0:a", "other", {"user_id": "u2", "document_id": "other", "filename": "b.txt", "page_number": 1, "chunk_index": 0, "content_hash": "b"})
    assert repository.replace_document("u1", "d", [first], [[1.0, 0.0]]) == 1
    assert repository.replace_document("u1", "d", [first], [[1.0, 0.0]]) == 1
    repository.replace_document("u2", "other", [other], [[0.0, 1.0]])
    repository.delete_document("u1", "d")
    assert repository.collection.get(where={"user_id": "u2"})["ids"] == ["other:0:a"]
