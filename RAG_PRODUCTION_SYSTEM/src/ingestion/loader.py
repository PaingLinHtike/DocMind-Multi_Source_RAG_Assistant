from io import BytesIO

from .models import SourcePage


class DocumentLoadError(ValueError):
    pass


def load_document(content: bytes, extension: str, filename: str, max_text_chars: int = 5_000_000) -> list[SourcePage]:
    extension = extension.lower().lstrip(".")
    try:
        if extension == "txt":
            text = content.decode("utf-8-sig")
            pages = [SourcePage(text, 1)]
        elif extension == "pdf":
            from pypdf import PdfReader
            pages = [SourcePage(page.extract_text() or "", index + 1) for index, page in enumerate(PdfReader(BytesIO(content)).pages)]
        elif extension == "docx":
            from docx import Document
            document = Document(BytesIO(content))
            pages = [SourcePage("\n".join(paragraph.text for paragraph in document.paragraphs), 1)]
        else:
            raise DocumentLoadError(f"Unsupported document type: {extension}")
    except DocumentLoadError:
        raise
    except Exception as error:
        raise DocumentLoadError(f"Could not read {filename}") from error

    if sum(len(page.text) for page in pages) > max_text_chars:
        raise DocumentLoadError("Extracted document text exceeds the configured limit")
    return pages
