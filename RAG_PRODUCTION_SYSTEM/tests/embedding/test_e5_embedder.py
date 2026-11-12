from RAG_PRODUCTION_SYSTEM.src.embedding.e5_embedder import E5Embedder


class FakeModel:
    def __init__(self):
        self.inputs = []

    def encode(self, texts, **kwargs):
        self.inputs = texts
        return [[3.0, 4.0] for _ in texts]


def test_embed_passages_prefixes_once_and_normalizes():
    model = FakeModel()
    vectors = E5Embedder(model=model).embed_passages(["alpha", "passage: beta"])
    assert model.inputs == ["passage: alpha", "passage: beta"]
    assert vectors == [[0.6, 0.8], [0.6, 0.8]]


def test_empty_passages_do_not_load_model():
    embedder = E5Embedder(model_factory=lambda _: (_ for _ in ()).throw(AssertionError("loaded")))
    assert embedder.embed_passages([]) == []
