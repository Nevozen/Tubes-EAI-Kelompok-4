from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


def _load_nearest_env() -> None:
    for directory in (Path(__file__).resolve().parent, *Path(__file__).resolve().parents):
        env_path = directory / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            return
    load_dotenv()


_load_nearest_env()


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _positive_int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default

    value = int(raw)
    if value <= 0:
        raise RuntimeError(f"Environment variable {name} must be a positive integer.")
    return value


@dataclass(frozen=True)
class Settings:
    database_url: str
    rabbitmq_url: str
    rabbitmq_exchange: str
    rabbitmq_exchange_type: str
    rabbitmq_routing_key: str
    rabbitmq_message_type: str
    outbox_max_attempts: int
    outbox_poll_interval_seconds: int
    outbox_batch_size: int


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        database_url=_required_env("DATABASE_URL"),
        rabbitmq_url=_required_env("RABBITMQ_URL"),
        rabbitmq_exchange=_required_env("RABBITMQ_EXCHANGE"),
        rabbitmq_exchange_type=_required_env("RABBITMQ_EXCHANGE_TYPE"),
        rabbitmq_routing_key=_required_env("RABBITMQ_ROUTING_KEY"),
        rabbitmq_message_type=_required_env("RABBITMQ_MESSAGE_TYPE"),
        outbox_max_attempts=_positive_int_env("OUTBOX_MAX_ATTEMPTS", 5),
        outbox_poll_interval_seconds=_positive_int_env("OUTBOX_POLL_INTERVAL_SECONDS", 5),
        outbox_batch_size=_positive_int_env("OUTBOX_BATCH_SIZE", 20),
    )
