import hashlib
import re
import unicodedata
from collections.abc import Sequence

from .models import CleanSection, EmptyDocumentError, SourcePage


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text.replace("\x00", "")).replace("\r\n", "\n").replace("\r", "\n")
    paragraphs = [re.sub(r"[ \t]+", " ", item).strip() for item in re.split(r"\n\s*\n", text)]
    return "\n\n".join(item for item in paragraphs if item)


def clean_sections(pages: Sequence[SourcePage]) -> list[CleanSection]:
    sections: list[CleanSection] = []
    seen: set[str] = set()
    for page in pages:
        text = _normalize(page.text)
        if not text:
            continue
        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        if content_hash in seen:
            continue
        seen.add(content_hash)
        sections.append(CleanSection(text, page.page_number, content_hash))
    if not sections:
        raise EmptyDocumentError("Document contains no indexable text")
    return sections
