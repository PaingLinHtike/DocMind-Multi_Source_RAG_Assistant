import chromadb
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from starlette.concurrency import run_in_threadpool

from ..config import get_settings
from ..embedding.e5_embedder import E5Embedder
from ..indexing.cancellation import CancellationRegistry, cancellation_registry
from ..indexing.service import IndexDocumentCommand, IndexingCancelled, IndexingService
from ..ingestion.loader import DocumentLoadError
from ..ingestion.models import EmptyDocumentError
from ..vectorstore.chroma_repository import ChromaRepository
from .security import require_internal_token

router = APIRouter(prefix="/internal/v1", dependencies=[Depends(require_internal_token)])


def get_cancellation_registry() -> CancellationRegistry:
    return cancellation_registry


def get_indexing_service() -> IndexingService:
    settings = get_settings()
    client = chromadb.PersistentClient(path=settings.chroma_persist_directory)
    repository = ChromaRepository(client, settings.chroma_collection)
    embedder = E5Embedder(settings.embedding_model)
    return IndexingService(repository, embedder, settings.chunk_size, settings.chunk_overlap)


@router.post("/documents/index")
async def index_document(
    file: UploadFile = File(), user_id: str = Form(), document_id: str = Form(),
    filename: str = Form(), extension: str = Form(), run_id: str = Form(),
    service: IndexingService = Depends(get_indexing_service),
    registry: CancellationRegistry = Depends(get_cancellation_registry),
) -> dict:
    if extension.lower().lstrip(".") not in {"pdf", "docx", "txt"}:
        raise HTTPException(422, "Unsupported document type")
    content = await file.read()
    token = registry.start(run_id)
    try:
        result = await run_in_threadpool(
            service.index,
            IndexDocumentCommand(user_id, document_id, filename, extension, content),
            lambda _: None,
            token.is_cancelled,
        )
    except (DocumentLoadError, EmptyDocumentError) as error:
        raise HTTPException(422, str(error)) from error
    except IndexingCancelled as error:
        raise HTTPException(409, "Indexing was stopped") from error
    finally:
        registry.finish(run_id)
    return {"chunk_count": result.chunk_count, "collection": result.collection, "embedding_model": result.embedding_model}


@router.post("/index-runs/{run_id}/cancel", status_code=status.HTTP_202_ACCEPTED)
def cancel_index_run(
    run_id: str,
    registry: CancellationRegistry = Depends(get_cancellation_registry),
) -> Response:
    registry.cancel(run_id)
    return Response(status_code=status.HTTP_202_ACCEPTED)


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(document_id: str, user_id: str, service: IndexingService = Depends(get_indexing_service)) -> None:
    service.repository.delete_document(user_id, document_id)
