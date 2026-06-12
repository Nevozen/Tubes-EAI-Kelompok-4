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


def _to_csv_list(name: str, default: list[str] | None = None) -> list[str]:
    raw = os.getenv(name, "").strip()
    if not raw:
        if default is not None:
            return default
        raise RuntimeError(f"Missing required environment variable: {name}")
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_version: str
    api_prefix: str
    database_url: str
    rabbitmq_url: str
    rabbitmq_exchange: str
    rabbitmq_exchange_type: str
    rabbitmq_queue: str
    rabbitmq_routing_keys: list[str]
    accepted_order_events: list[str]
    invoice_currency_default: str
    reconnect_delay_seconds: int
    page_size_default: int
    page_size_max: int


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "WatchCommerce Accounting API"),
        app_version=os.getenv("APP_VERSION", "1.0.0"),
        api_prefix=os.getenv("API_PREFIX", "/api/v1"),
        database_url=_required_env("DATABASE_URL"),
        rabbitmq_url=_required_env("RABBITMQ_URL"),
        rabbitmq_exchange=_required_env("RABBITMQ_EXCHANGE"),
        rabbitmq_exchange_type=_required_env("RABBITMQ_EXCHANGE_TYPE"),
        rabbitmq_queue=_required_env("RABBITMQ_QUEUE"),
        rabbitmq_routing_keys=_to_csv_list("RABBITMQ_ROUTING_KEYS"),
        accepted_order_events=_to_csv_list("ACCEPTED_ORDER_EVENTS", ["OrderCreated", "order.created"]),
        invoice_currency_default=os.getenv("INVOICE_CURRENCY_DEFAULT", "IDR"),
        reconnect_delay_seconds=int(os.getenv("RABBITMQ_RECONNECT_DELAY", "5")),
        page_size_default=int(os.getenv("PAGE_SIZE_DEFAULT", "20")),
        page_size_max=int(os.getenv("PAGE_SIZE_MAX", "100")),
    )
