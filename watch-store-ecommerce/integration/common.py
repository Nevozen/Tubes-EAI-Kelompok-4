import json
import os
from typing import Any

import pika
from dotenv import load_dotenv

load_dotenv()


def csv_env(name: str, default: list[str]) -> list[str]:
    value = os.getenv(name)
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


def build_rabbitmq_url() -> str:
    explicit = os.getenv("RABBITMQ_URL")
    if explicit:
        return explicit

    host = os.getenv("RABBITMQ_HOST", "localhost")
    port = os.getenv("RABBITMQ_PORT", "5672")
    user = os.getenv("RABBITMQ_USER", "guest")
    password = os.getenv("RABBITMQ_PASSWORD", os.getenv("RABBITMQ_PASS", "guest"))
    return f"amqp://{user}:{password}@{host}:{port}/%2F"


def create_connection() -> pika.BlockingConnection:
    parameters = pika.URLParameters(build_rabbitmq_url())
    parameters.heartbeat = 600
    parameters.blocked_connection_timeout = 300
    return pika.BlockingConnection(parameters)


def declare_exchange(channel, exchange_name: str, exchange_type: str) -> None:
    channel.exchange_declare(exchange=exchange_name, exchange_type=exchange_type, durable=True)


def publish_json(channel, exchange_name: str, routing_key: str, payload: dict[str, Any], message_type: str) -> None:
    channel.basic_publish(
        exchange=exchange_name,
        routing_key=routing_key,
        body=json.dumps(payload, default=str),
        properties=pika.BasicProperties(
            delivery_mode=2,
            content_type="application/json",
            type=message_type,
        ),
    )


def decode_json(body: bytes) -> dict[str, Any]:
    payload = json.loads(body.decode("utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("Payload must be a JSON object.")
    return payload


def validate_order_created_payload(payload: dict[str, Any], accepted_event_types: set[str]) -> dict[str, Any]:
    event_type = str(payload.get("event_type") or payload.get("event") or payload.get("type") or "").strip()
    if not event_type:
        raise ValueError("Missing event_type in payload.")
    if accepted_event_types and event_type.lower() not in accepted_event_types:
        raise ValueError(f"Unsupported event type: {event_type}")

    data = payload.get("data")
    if not isinstance(data, dict):
        raise ValueError("Payload must include a data object.")

    order_id = str(data.get("order_id") or data.get("id") or "").strip()
    if not order_id:
        raise ValueError("Payload must include data.order_id.")

    items = data.get("items")
    if not isinstance(items, list) or not items:
        raise ValueError("Payload must include at least one item.")

    return payload
