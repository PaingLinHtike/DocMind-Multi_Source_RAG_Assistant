from dataclasses import dataclass
from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    return default


@dataclass(frozen=True)
class Settings:
    internal_token: str = ""
    chroma_persist_directory: str = "RAG_PRODUCTION_SYSTEM/data/vectordb"
    chroma_collection: str = "docmind"
    embedding_model: str = "intfloat/e5-base-v2"
    chunk_size: int = 512
    chunk_overlap: int = 64
    retrieval_top_k: int = 5
    minimum_similarity: float = 0.2
    context_token_budget: int = 6000
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    request_timeout: float = 30.0
    langsmith_tracing: bool = False
    langsmith_api_key: str = ""
    langsmith_project: str = "docmind-rag"
    langsmith_endpoint: str = "https://api.smith.langchain.com"
    langsmith_hash_salt: str = ""
    langsmith_capture_content: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings(
        internal_token=os.getenv("RAG_INTERNAL_TOKEN", ""),
        chroma_persist_directory=os.getenv("CHROMA_PERSIST_DIRECTORY", "RAG_PRODUCTION_SYSTEM/data/vectordb"),
        chroma_collection=os.getenv("CHROMA_COLLECTION", "docmind"),
        embedding_model=os.getenv("EMBEDDING_MODEL", "intfloat/e5-base-v2"),
        chunk_size=int(os.getenv("CHUNK_SIZE", "512")),
        chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "64")),
        retrieval_top_k=int(os.getenv("RETRIEVAL_TOP_K", "5")),
        minimum_similarity=float(os.getenv("MINIMUM_SIMILARITY", "0.2")),
        context_token_budget=int(os.getenv("CONTEXT_TOKEN_BUDGET", "6000")),
        deepseek_api_key=os.getenv("DEEPSEEK_API_KEY", ""),
        deepseek_base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
        deepseek_model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
        request_timeout=float(os.getenv("RAG_REQUEST_TIMEOUT", "30")),
        langsmith_tracing=_env_bool("LANGSMITH_TRACING"),
        langsmith_api_key=os.getenv("LANGSMITH_API_KEY", ""),
        langsmith_project=os.getenv("LANGSMITH_PROJECT", "docmind-rag"),
        langsmith_endpoint=os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com"),
        langsmith_hash_salt=os.getenv("LANGSMITH_HASH_SALT", ""),
        langsmith_capture_content=_env_bool("LANGSMITH_CAPTURE_CONTENT"),
    )
