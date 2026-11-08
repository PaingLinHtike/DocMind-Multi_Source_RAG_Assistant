from fastapi.testclient import TestClient

from RAG_PRODUCTION_SYSTEM.src.api.indexing import get_indexing_service
from RAG_PRODUCTION_SYSTEM.src.api.main import app
from RAG_PRODUCTION_SYSTEM.src.config import get_settings
from RAG_PRODUCTION_SYSTEM.src.indexing.service import IndexResult


class FakeService:
    def index(self, command, progress, is_cancelled):
        self.command = command
        self.was_cancelled = is_cancelled()
        return IndexResult(2, "test", "intfloat/e5-base-v2")


def test_index_endpoint_requires_token_and_indexes_file(monkeypatch):
    monkeypatch.setenv("RAG_INTERNAL_TOKEN", "secret")
    get_settings.cache_clear()
    service = FakeService()
    app.dependency_overrides[get_indexing_service] = lambda: service
    client = TestClient(app)
    assert client.post("/internal/v1/documents/index").status_code == 401
    response = client.post(
        "/internal/v1/documents/index",
        headers={"X-Internal-Token": "secret"},
        data={
            "user_id": "u", "document_id": "d", "filename": "a.txt", "extension": "txt",
            "run_id": "run-123",
        },
        files={"file": ("a.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 200
    assert response.json()["chunk_count"] == 2
    assert service.command.content == b"hello"
    assert service.was_cancelled is False
    app.dependency_overrides.clear()


def test_cancel_endpoint_is_authenticated_and_idempotent(monkeypatch):
    monkeypatch.setenv("RAG_INTERNAL_TOKEN", "secret")
    get_settings.cache_clear()
    client = TestClient(app)

    assert client.post("/internal/v1/index-runs/run-123/cancel").status_code == 401
    first = client.post(
        "/internal/v1/index-runs/run-123/cancel",
        headers={"X-Internal-Token": "secret"},
    )
    second = client.post(
        "/internal/v1/index-runs/run-123/cancel",
        headers={"X-Internal-Token": "secret"},
    )

    assert first.status_code == 202
    assert second.status_code == 202
