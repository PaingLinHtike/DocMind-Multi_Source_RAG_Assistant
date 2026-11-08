from RAG_PRODUCTION_SYSTEM.src.indexing.service import IndexDocumentCommand, IndexingService


class FakeEmbedder:
    model_name = "intfloat/e5-base-v2"
    def embed_passages(self, texts): return [[1.0, 0.0] for _ in texts]


class FakeRepository:
    collection_name = "test"
    def replace_document(self, user_id, document_id, chunks, vectors):
        self.chunks = chunks
        return len(chunks)


def test_indexing_service_reports_progress_and_result():
    repository = FakeRepository()
    service = IndexingService(repository, FakeEmbedder(), chunk_size=3, chunk_overlap=1)
    progress = []
    result = service.index(IndexDocumentCommand("u", "d", "a.txt", "txt", b"one two three four"), progress.append)
    assert progress == ["parsing", "preprocessing", "chunking", "embedding", "storing"]
    assert result.chunk_count == 2
    assert result.embedding_model == "intfloat/e5-base-v2"
