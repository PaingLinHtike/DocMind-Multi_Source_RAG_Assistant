# My RAG stack

Beginner / MVP

- Frontend: React (Basic)
- Backend: Laravel + FastAPI (Advanced)
- RAG framework: LangChain (Basic)
- Query expansion: Direct query (Basic)
- Query result fusion: No fusion (Basic)
- Language model: Hosted LLM (Basic)
- Embeddings: Sentence Transformers (Advanced)
- Vector database: ChromaDB (Basic)
- Database: PostgreSQL (Advanced)
- Retrieval strategy: Semantic search (Basic)
- Evaluation: Manual test set (Basic)
- Monitoring: Application logs (Basic)

Implementation checklist
- Parse documents, chunk text, and preserve source metadata.
- Embed approved content and index it in the vector store.
- Prepare the question with Direct query, retrieve evidence with Semantic search, combine results using No fusion, then let Hosted LLM write the final answer with citations.
- Use RAG Fusion to rank evidence across multiple expanded queries.
- Keep API keys server-side and enforce document access.
- Evaluate answers with a fixed test set before release.
- Package services with Docker; choose hosting for your workload.

Based on supplied project notes. Verify tool compatibility, pricing, and deployment requirements.
