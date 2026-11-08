from dataclasses import asdict

import chromadb
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..config import get_settings
from ..embedding.e5_embedder import E5Embedder
from ..generation.llm_client import DeepSeekClient
from ..generation.service import GenerationService
from ..retrieval.retriever import SemanticRetriever
from ..vectorstore.chroma_repository import ChromaRepository
from .security import require_internal_token

router = APIRouter(prefix="/internal/v1", dependencies=[Depends(require_internal_token)])


class AnswerRequest(BaseModel):
    user_id: str = Field(min_length=1)
    conversation_id: str = Field(min_length=1)
    message_id: str = Field(min_length=1)
    question: str = Field(min_length=1)
    document_ids: list[str] | None = None


def get_generation_service() -> GenerationService:
    settings = get_settings()
    repository = ChromaRepository(chromadb.PersistentClient(path=settings.chroma_persist_directory), settings.chroma_collection)
    embedder = E5Embedder(settings.embedding_model)
    retriever = SemanticRetriever(repository, embedder, settings.retrieval_top_k, settings.minimum_similarity)
    client = DeepSeekClient(settings.deepseek_api_key, settings.deepseek_base_url, settings.deepseek_model, settings.request_timeout)
    return GenerationService(retriever, client, settings.context_token_budget)


@router.post("/answers")
async def answer(request: AnswerRequest, service: GenerationService = Depends(get_generation_service)) -> dict:
    result = await service.answer(request.question.strip(), request.user_id, request.document_ids)
    return {"answer": result.answer, "citations": [asdict(citation) for citation in result.citations]}
