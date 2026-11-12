from collections.abc import Sequence

from .models import RetrievedChunk


class SemanticRetriever:
    def __init__(self, repository, embedder, top_k: int = 5, minimum_similarity: float = 0.2):
        self.repository = repository
        self.embedder = embedder
        self.top_k = top_k
        self.minimum_similarity = minimum_similarity

    def search(self, query: str, user_id: str, document_ids: Sequence[str] | None = None) -> list[RetrievedChunk]:
        result = self.repository.query(self.embedder.embed_query(query), user_id, document_ids, self.top_k)
        items: list[RetrievedChunk] = []
        for chunk_id, text, distance, metadata in zip(
            result.get("ids", [[]])[0], result.get("documents", [[]])[0],
            result.get("distances", [[]])[0], result.get("metadatas", [[]])[0], strict=True,
        ):
            score = max(0.0, min(1.0, 1.0 - float(distance)))
            if score < self.minimum_similarity:
                continue
            items.append(RetrievedChunk(
                text=text, score=score, document_id=str(metadata["document_id"]),
                filename=str(metadata["filename"]), page_number=int(metadata["page_number"]) or None,
                chunk_id=chunk_id,
            ))
        return sorted(items, key=lambda item: (-item.score, item.chunk_id))
