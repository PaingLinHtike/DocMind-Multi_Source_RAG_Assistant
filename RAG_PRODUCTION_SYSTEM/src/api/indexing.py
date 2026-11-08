import chromadb
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..config import get_settings
from ..embedding.e5_embedder import E5Embedder
from ..indexing.service import IndexDocumentCommand, IndexingService
from ..ingestion.loader import DocumentLoadError
from ..ingestion.models import EmptyDocumentError
from ..vectorstore.chroma_repository import ChromaRepository
from .security import require_internal_token

router = APIRouter(prefix="/internal/v1", dependencies=[Depends(require_internal_token)])


def get_indexing_service() -> IndexingService:
    settings = get_settings()
    client = chromadb.PersistentClient(path=settings.chroma_persist_directory)
    repository = ChromaRepository(client, settings.chroma_collection)
    embedder = E5Embedder(settings.embedding_model)
    return IndexingService(repository, embedder, settings.chunk_size, settings.chunk_overlap)


@router.post("/documents/index")
async def index_document(
    file: UploadFile = File(), user_id: str = Form(), document_id: str = Form(),
    filename: str = Form(), extension: str = Form(),
    service: IndexingService = Depends(get_indexing_service),
) -> dict:
    if extension.lower().lstrip(".") not in {"pdf", "docx", "txt"}:
        raise HTTPException(422, "Unsupported document type")
    content = await file.read()
    try:
        result = service.index(IndexDocumentCommand(user_id, document_id, filename, extension, content), lambda _: None)
    except (DocumentLoadError, EmptyDocumentError) as error:
        raise HTTPException(422, str(error)) from error
    return {"chunk_count": result.chunk_count, "collection": result.collection, "embedding_model": result.embedding_model}


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(document_id: str, user_id: str, service: IndexingService = Depends(get_indexing_service)) -> None:
    service.repository.delete_document(user_id, document_id)
