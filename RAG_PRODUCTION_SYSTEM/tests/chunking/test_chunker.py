from RAG_PRODUCTION_SYSTEM.src.chunking.chunker import chunk_sections
from RAG_PRODUCTION_SYSTEM.src.ingestion.models import CleanSection


def test_chunker_is_deterministic_and_preserves_metadata():
    section = CleanSection("one two three four five six", 2, "abc")
    chunks = chunk_sections([section], user_id="u1", document_id="d1", filename="a.txt", chunk_size=4, overlap=1)
    assert [chunk.text for chunk in chunks] == ["one two three four", "four five six"]
    assert chunks[0].id == "d1:0:abc"
    assert chunks[0].metadata["user_id"] == "u1"
    assert chunks[0].metadata["page_number"] == 2
