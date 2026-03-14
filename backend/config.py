import os
from datetime import timedelta


class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_HTTPONLY = True
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)
    ROOM_TTL_SECONDS = 3600
    DATABASE_PATH = os.environ.get("DATABASE_PATH", "sub_five.db")


class DevConfig(BaseConfig):
    DEBUG = True
    SESSION_COOKIE_SECURE = False
    DEV_MODE = True


class ProdConfig(BaseConfig):
    DEBUG = False
    DEV_MODE = False


class TestConfig(BaseConfig):
    TESTING = True
    SESSION_COOKIE_SECURE = False
    REDIS_URL = "redis://localhost:6379/1"
    DATABASE_PATH = ":memory:"
    DEV_MODE = True


def get_config():
    env = os.environ.get("FLASK_ENV", "development")
    configs = {
        "development": DevConfig,
        "production": ProdConfig,
        "testing": TestConfig,
    }
    return configs.get(env, DevConfig)
