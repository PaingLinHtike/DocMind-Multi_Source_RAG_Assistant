import pytest

from RAG_PRODUCTION_SYSTEM.src.ingestion.loader import DocumentLoadError, load_document
from RAG_PRODUCTION_SYSTEM.src.ingestion.models import EmptyDocumentError, SourcePage
from RAG_PRODUCTION_SYSTEM.src.ingestion.splitter import clean_sections


def test_txt_loader_returns_source_page():
    assert load_document(b"First paragraph", "txt", "notes.txt") == [SourcePage("First paragraph", 1)]


def test_loader_rejects_unsupported_content_without_echoing_it():
    secret = "private source text"
    with pytest.raises(DocumentLoadError) as error:
        load_document(secret.encode(), "exe", "bad.exe")
    assert secret not in str(error.value)


def test_cleaner_normalizes_and_deduplicates_stably():
    pages = [SourcePage("  Alpha\r\n\r\nBeta  ", 1), SourcePage("Alpha\n\nBeta", 2), SourcePage(" \x00 ", 3)]
    result = clean_sections(pages)
    assert [section.text for section in result] == ["Alpha\n\nBeta"]
    assert result[0].page_number == 1
    assert len(result[0].content_hash) == 64


def test_cleaner_rejects_empty_document():
    with pytest.raises(EmptyDocumentError):
        clean_sections([SourcePage(" \x00\n", 1)])
