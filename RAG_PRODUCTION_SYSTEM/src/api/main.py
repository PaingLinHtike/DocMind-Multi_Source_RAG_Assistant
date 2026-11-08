from fastapi import Depends, FastAPI

from .security import require_internal_token

app = FastAPI(title="DocMind RAG")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/internal/v1/probe", dependencies=[Depends(require_internal_token)], include_in_schema=False)
def probe() -> dict[str, str]:
    return {"status": "ok"}
