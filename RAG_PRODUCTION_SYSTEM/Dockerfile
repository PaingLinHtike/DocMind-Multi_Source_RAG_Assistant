FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && useradd --create-home appuser
COPY RAG_PRODUCTION_SYSTEM ./RAG_PRODUCTION_SYSTEM
RUN mkdir -p /app/RAG_PRODUCTION_SYSTEM/data/vectordb && chown -R appuser:appuser /app
USER appuser
EXPOSE 8001
CMD ["uvicorn", "RAG_PRODUCTION_SYSTEM.src.api.main:app", "--host", "0.0.0.0", "--port", "8001"]
