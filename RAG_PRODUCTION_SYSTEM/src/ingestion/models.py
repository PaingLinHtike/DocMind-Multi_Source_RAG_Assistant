from dataclasses import dataclass


class EmptyDocumentError(ValueError):
    pass


@dataclass(frozen=True)
class SourcePage:
    text: str
    page_number: int | None = None


@dataclass(frozen=True)
class CleanSection:
    text: str
    page_number: int | None
    content_hash: str
