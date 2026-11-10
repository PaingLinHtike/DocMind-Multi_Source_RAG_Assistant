from fastapi.testclient import TestClient

from RAG_PRODUCTION_SYSTEM.src.api import generation
from RAG_PRODUCTION_SYSTEM.src.api.generation import get_generation_service
from RAG_PRODUCTION_SYSTEM.src.api.main import app
from RAG_PRODUCTION_SYSTEM.src.config import get_settings
from RAG_PRODUCTION_SYSTEM.src.generation.service import AnswerResult
from RAG_PRODUCTION_SYSTEM.src.generation.llm_client import LlmResponseError


class FakeService:
    async def answer(self, question, user_id, document_ids=None, trace_context=None):
        self.trace_context = trace_context
        return AnswerResult("Grounded [1]", [])


class FailingService:
    async def answer(self, question, user_id, document_ids=None, trace_context=None):
        raise LlmResponseError("provider failure with secret details")


def test_answer_endpoint_is_internal(monkeypatch):
    monkeypatch.setenv("RAG_INTERNAL_TOKEN", "secret")
    get_settings.cache_clear()
    service = FakeService()
    app.dependency_overrides[get_generation_service] = lambda: service
    client = TestClient(app)
    assert client.post("/internal/v1/answers", json={}).status_code == 401
    response = client.post("/internal/v1/answers", headers={"X-Internal-Token": "secret"}, json={
        "user_id": "u", "conversation_id": "c", "message_id": "m", "question": "What?",
    })
    assert response.status_code == 200
    assert response.json() == {"answer": "Grounded [1]", "citations": []}
    assert service.trace_context.user_id == "u"
    assert service.trace_context.conversation_id == "c"
    assert service.trace_context.message_id == "m"
    app.dependency_overrides.clear()


def test_answer_endpoint_sanitizes_generation_failure(monkeypatch):
    monkeypatch.setenv("RAG_INTERNAL_TOKEN", "secret")
    monkeypatch.setenv("LANGSMITH_TRACING", "true")
    monkeypatch.setenv("LANGSMITH_API_KEY", "test-key")
    monkeypatch.setenv("LANGSMITH_HASH_SALT", "test-salt")
    get_settings.cache_clear()
    app.dependency_overrides[get_generation_service] = lambda: FailingService()
    response = TestClient(app, raise_server_exceptions=False).post(
        "/internal/v1/answers", headers={"X-Internal-Token": "secret"},
        json={"user_id": "u", "conversation_id": "c", "message_id": "m", "question": "What?"},
    )
    assert response.status_code == 503
    assert response.json() == {"detail": "Answer generation is temporarily unavailable"}
    app.dependency_overrides.clear()


def test_generation_service_factory_injects_configured_observer(monkeypatch):
    sentinel_observer = object()
    captured = {}

    monkeypatch.setattr(generation.chromadb, "PersistentClient", lambda **kwargs: object())
    monkeypatch.setattr(generation, "ChromaRepository", lambda *args: object())
    monkeypatch.setattr(generation, "E5Embedder", lambda *args: object())
    monkeypatch.setattr(generation, "SemanticRetriever", lambda *args: object())
    monkeypatch.setattr(generation, "DeepSeekClient", lambda *args: object())
    monkeypatch.setattr(generation, "build_observer", lambda settings: sentinel_observer)

    monkeypatch.setenv("LANGSMITH_CAPTURE_CONTENT", "true")
    get_settings.cache_clear()

    def capture_service(retriever, client, budget, observer=None, capture_trace_content=False):
        captured["observer"] = observer
        captured["capture_trace_content"] = capture_trace_content
        return object()

    monkeypatch.setattr(generation, "GenerationService", capture_service)

    get_generation_service()

    assert captured["observer"] is sentinel_observer
    assert captured["capture_trace_content"] is True
    get_settings.cache_clear()
