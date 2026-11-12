from fastapi import Depends, FastAPI

from .security import require_internal_token
from .indexing import router as indexing_router
from .generation import router as generation_router

app = FastAPI(title="DocMind RAG")
app.include_router(indexing_router)
app.include_router(generation_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/internal/v1/probe", dependencies=[Depends(require_internal_token)], include_in_schema=False)
def probe() -> dict[str, str]:
    return {"status": "ok"}
