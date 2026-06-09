from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _to_csv_list(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


def _build_database_url() -> str:
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return explicit_url

    engine = os.getenv("DB_ENGINE", "sqlite").strip().lower()

    if engine in {"postgres", "postgresql"}:
        user = os.getenv("DB_USER", "postgres")
        password = os.getenv("DB_PASSWORD", "postgres")
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "5432")
        name = os.getenv("DB_NAME", "accounting_db")
        return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"

    if engine in {"mysql", "mariadb"}:
        user = os.getenv("DB_USER", "root")
        password = os.getenv("DB_PASSWORD", "")
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "3306")
        name = os.getenv("DB_NAME", "accounting_db")
        return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"

    sqlite_path = os.getenv("SQLITE_PATH", "./accounting.db")
    return f"sqlite:///{sqlite_path}"


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
        database_url=_build_database_url(),
        rabbitmq_url=os.getenv(
            "RABBITMQ_URL",
            "amqp://guest:guest@localhost:5672/%2F",
        ),
        rabbitmq_exchange=os.getenv("RABBITMQ_EXCHANGE", "watchcommerce.events"),
        rabbitmq_exchange_type=os.getenv("RABBITMQ_EXCHANGE_TYPE", "topic"),
        rabbitmq_queue=os.getenv("RABBITMQ_QUEUE", "accounting.order.created"),
        rabbitmq_routing_keys=_to_csv_list(
            os.getenv("RABBITMQ_ROUTING_KEYS"),
            ["order.created", "OrderCreated"],
        ),
        accepted_order_events=_to_csv_list(
            os.getenv("ACCEPTED_ORDER_EVENTS"),
            ["OrderCreated", "order.created"],
        ),
        invoice_currency_default=os.getenv("INVOICE_CURRENCY_DEFAULT", "IDR"),
        reconnect_delay_seconds=int(os.getenv("RABBITMQ_RECONNECT_DELAY", "5")),
        page_size_default=int(os.getenv("PAGE_SIZE_DEFAULT", "20")),
        page_size_max=int(os.getenv("PAGE_SIZE_MAX", "100")),
    )
