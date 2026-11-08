from collections.abc import Sequence

from ..chunking.chunker import DocumentChunk


def _scope(user_id: str, document_id: str) -> dict:
    return {"$and": [{"user_id": user_id}, {"document_id": document_id}]}


class ChromaRepository:
    def __init__(self, client, collection_name: str = "docmind"):
        self.collection_name = collection_name
        self.collection = client.get_or_create_collection(collection_name, metadata={"hnsw:space": "cosine"})

    def replace_document(self, user_id: str, document_id: str, chunks: Sequence[DocumentChunk], vectors: Sequence[Sequence[float]]) -> int:
        if len(chunks) != len(vectors):
            raise ValueError("Chunk and vector counts differ")
        old_ids = set(self.collection.get(where=_scope(user_id, document_id))["ids"])
        new_ids = [chunk.id for chunk in chunks]
        if chunks:
            self.collection.upsert(
                ids=new_ids,
                documents=[chunk.text for chunk in chunks],
                metadatas=[chunk.metadata for chunk in chunks],
                embeddings=[list(vector) for vector in vectors],
            )
        stale = list(old_ids - set(new_ids))
        if stale:
            self.collection.delete(ids=stale)
        return len(chunks)

    def delete_document(self, user_id: str, document_id: str) -> None:
        self.collection.delete(where=_scope(user_id, document_id))

    def query(self, vector: Sequence[float], user_id: str, document_ids: Sequence[str] | None, limit: int) -> dict:
        clauses: list[dict] = [{"user_id": user_id}]
        if document_ids:
            clauses.append({"document_id": {"$in": list(document_ids)}})
        where = clauses[0] if len(clauses) == 1 else {"$and": clauses}
        return self.collection.query(query_embeddings=[list(vector)], n_results=limit, where=where)
