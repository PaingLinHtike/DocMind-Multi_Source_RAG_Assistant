from threading import Event, Lock


class CancellationToken:
    def __init__(self, event: Event):
        self._event = event

    def is_cancelled(self) -> bool:
        return self._event.is_set()


class CancellationRegistry:
    def __init__(self):
        self._lock = Lock()
        self._active: dict[str, Event] = {}
        self._cancelled: set[str] = set()

    def start(self, run_id: str) -> CancellationToken:
        with self._lock:
            event = self._active.setdefault(run_id, Event())
            if run_id in self._cancelled:
                event.set()
            return CancellationToken(event)

    def cancel(self, run_id: str) -> None:
        with self._lock:
            self._cancelled.add(run_id)
            event = self._active.get(run_id)
            if event is not None:
                event.set()

    def finish(self, run_id: str) -> None:
        with self._lock:
            self._active.pop(run_id, None)
            self._cancelled.discard(run_id)


cancellation_registry = CancellationRegistry()
