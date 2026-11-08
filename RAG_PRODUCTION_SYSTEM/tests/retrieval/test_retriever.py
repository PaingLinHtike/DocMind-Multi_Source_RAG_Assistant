from RAG_PRODUCTION_SYSTEM.src.retrieval.retriever import SemanticRetriever


class FakeEmbedder:
    def embed_query(self, query): return [1.0, 0.0]


class FakeRepository:
    def query(self, vector, user_id, document_ids, limit):
        self.scope = (user_id, document_ids, limit)
        return {"ids": [["c1", "c2"]], "documents": [["first", "second"]], "distances": [[0.1, 0.9]], "metadatas": [[
            {"document_id": "d1", "filename": "a.txt", "page_number": 1},
            {"document_id": "d2", "filename": "b.txt", "page_number": 2},
        ]]}


def test_semantic_retriever_filters_scope_and_score():
    repository = FakeRepository()
    result = SemanticRetriever(repository, FakeEmbedder(), top_k=5, minimum_similarity=0.2).search("question", "u1", ["d1"])
    assert repository.scope == ("u1", ["d1"], 5)
    assert [item.chunk_id for item in result] == ["c1"]
    assert result[0].score == 0.9
