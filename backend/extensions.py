import threading
from flask_socketio import SocketIO
from flask_login import LoginManager

socketio = SocketIO()
login_manager = LoginManager()
redis_client = None


class InMemoryRedis:
    """Minimal Redis-compatible in-memory store for dev without Redis."""

    def __init__(self):
        self._data: dict[str, str] = {}
        self._lock = threading.Lock()

    def get(self, key):
        with self._lock:
            return self._data.get(key)

    def set(self, key, value, ex=None):
        with self._lock:
            self._data[key] = value

    def setex(self, key, ttl, value):
        self.set(key, value, ex=ttl)

    def delete(self, *keys):
        with self._lock:
            for k in keys:
                self._data.pop(k, None)

    def keys(self, pattern="*"):
        import fnmatch
        with self._lock:
            return [k for k in self._data if fnmatch.fnmatch(k, pattern)]

    def setnx(self, key, value):
        """SET if Not eXists. Returns True if set, False if already exists."""
        with self._lock:
            if key not in self._data:
                self._data[key] = value
                return True
            return False

    def eval(self, script, numkeys, *args):
        """Minimal eval for the lock release script."""
        key = args[0] if args else None
        val = args[1] if len(args) > 1 else None
        with self._lock:
            if self._data.get(key) == val:
                del self._data[key]
                return 1
            return 0


def init_redis(app):
    global redis_client
    try:
        import redis
        client = redis.from_url(app.config["REDIS_URL"], decode_responses=True)
        client.ping()
        redis_client = client
        app.logger.info("Connected to Redis at %s", app.config["REDIS_URL"])
    except Exception:
        redis_client = InMemoryRedis()
        app.logger.warning("Redis unavailable — using in-memory store (dev only)")
    return redis_client


def get_redis():
    return redis_client
