from collections.abc import Callable, Sequence
import math


class InvalidQueryError(ValueError):
    pass


class E5Embedder:
    def __init__(self, model_name: str = "intfloat/e5-base-v2", model=None, model_factory: Callable | None = None):
        self.model_name = model_name
        self._model = model
        self._factory = model_factory

    def _get_model(self):
        if self._model is None:
            factory = self._factory
            if factory is None:
                from sentence_transformers import SentenceTransformer
                factory = SentenceTransformer
            self._model = factory(self.model_name)
        return self._model

    @staticmethod
    def _normalize(vector) -> list[float]:
        values = [float(value) for value in vector]
        magnitude = math.sqrt(sum(value * value for value in values))
        return [value / magnitude for value in values] if magnitude else values

    def embed_passages(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []
        prefixed = [text if text.startswith("passage: ") else f"passage: {text}" for text in texts]
        vectors = self._get_model().encode(prefixed, normalize_embeddings=False)
        return [self._normalize(vector) for vector in vectors]

    def embed_query(self, text: str) -> list[float]:
        text = text.strip()
        if not text:
            raise InvalidQueryError("Query cannot be empty")
        prefixed = text if text.startswith("query: ") else f"query: {text}"
        return self._normalize(self._get_model().encode([prefixed], normalize_embeddings=False)[0])
