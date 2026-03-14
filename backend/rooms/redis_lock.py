"""Redis-based distributed lock for room-level atomicity."""
import uuid
import time


class RoomBusyError(Exception):
    pass


class RedisRoomLock:
    """Context manager using Redis SET NX EX for room-level locking."""

    def __init__(self, redis_client, room_code, timeout=5, retry_delay=0.05, max_retries=20):
        self.redis = redis_client
        self.lock_key = f"lock:room:{room_code}"
        self.timeout = timeout
        self.lock_id = str(uuid.uuid4())
        self.retry_delay = retry_delay
        self.max_retries = max_retries

    def __enter__(self):
        for _ in range(self.max_retries):
            acquired = self.redis.set(
                self.lock_key, self.lock_id, nx=True, ex=self.timeout
            )
            if acquired:
                return self
            time.sleep(self.retry_delay)
        raise RoomBusyError("Could not acquire room lock")

    def __exit__(self, *args):
        # Only release if we still hold the lock (compare-and-delete)
        pipe = self.redis.pipeline(True)
        try:
            pipe.watch(self.lock_key)
            if pipe.get(self.lock_key) == self.lock_id:
                pipe.multi()
                pipe.delete(self.lock_key)
                pipe.execute()
            else:
                pipe.unwatch()
        except Exception:
            pipe.unwatch()
