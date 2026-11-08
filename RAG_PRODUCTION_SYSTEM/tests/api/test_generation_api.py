from fastapi.testclient import TestClient

from RAG_PRODUCTION_SYSTEM.src.api.generation import get_generation_service
from RAG_PRODUCTION_SYSTEM.src.api.main import app
from RAG_PRODUCTION_SYSTEM.src.config import get_settings
from RAG_PRODUCTION_SYSTEM.src.generation.service import AnswerResult
from RAG_PRODUCTION_SYSTEM.src.generation.llm_client import LlmResponseError


class FakeService:
    async def answer(self, question, user_id, document_ids=None):
        return AnswerResult("Grounded [1]", [])


class FailingService:
    async def answer(self, question, user_id, document_ids=None):
        raise LlmResponseError("provider failure with secret details")


def test_answer_endpoint_is_internal(monkeypatch):
    monkeypatch.setenv("RAG_INTERNAL_TOKEN", "secret")
    get_settings.cache_clear()
    app.dependency_overrides[get_generation_service] = lambda: FakeService()
    client = TestClient(app)
    assert client.post("/internal/v1/answers", json={}).status_code == 401
    response = client.post("/internal/v1/answers", headers={"X-Internal-Token": "secret"}, json={
        "user_id": "u", "conversation_id": "c", "message_id": "m", "question": "What?",
    })
    assert response.status_code == 200
    assert response.json() == {"answer": "Grounded [1]", "citations": []}
    app.dependency_overrides.clear()


def test_answer_endpoint_sanitizes_generation_failure(monkeypatch):
    monkeypatch.setenv("RAG_INTERNAL_TOKEN", "secret")
    get_settings.cache_clear()
    app.dependency_overrides[get_generation_service] = lambda: FailingService()
    response = TestClient(app, raise_server_exceptions=False).post(
        "/internal/v1/answers", headers={"X-Internal-Token": "secret"},
        json={"user_id": "u", "conversation_id": "c", "message_id": "m", "question": "What?"},
    )
    assert response.status_code == 503
    assert response.json() == {"detail": "Answer generation is temporarily unavailable"}
    app.dependency_overrides.clear()
