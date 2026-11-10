import os

from fastapi.testclient import TestClient

from RAG_PRODUCTION_SYSTEM.src.api.main import app
from RAG_PRODUCTION_SYSTEM.src.config import get_settings


def test_health_is_public():
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_internal_route_rejects_missing_token(monkeypatch):
    monkeypatch.setenv("RAG_INTERNAL_TOKEN", "secret")
    get_settings.cache_clear()
    response = TestClient(app).get("/internal/v1/probe")
    assert response.status_code == 401


def test_settings_use_e5_defaults(monkeypatch):
    for name in ("EMBEDDING_MODEL", "CHUNK_SIZE", "CHUNK_OVERLAP"):
        monkeypatch.delenv(name, raising=False)
    get_settings.cache_clear()
    settings = get_settings()
    assert settings.embedding_model == "intfloat/e5-base-v2"
    assert settings.chunk_size == 512
    assert settings.chunk_overlap == 64


def test_langsmith_settings_default_to_disabled(monkeypatch):
    for name in (
        "LANGSMITH_TRACING",
        "LANGSMITH_API_KEY",
        "LANGSMITH_PROJECT",
        "LANGSMITH_ENDPOINT",
        "LANGSMITH_HASH_SALT",
    ):
        monkeypatch.delenv(name, raising=False)
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.langsmith_tracing is False
    assert settings.langsmith_project == "docmind-rag"
    assert settings.langsmith_endpoint == "https://api.smith.langchain.com"


def test_invalid_langsmith_tracing_value_fails_closed(monkeypatch):
    monkeypatch.setenv("LANGSMITH_TRACING", "sometimes")
    get_settings.cache_clear()

    assert get_settings().langsmith_tracing is False
