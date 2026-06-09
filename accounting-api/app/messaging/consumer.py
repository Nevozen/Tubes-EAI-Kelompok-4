from __future__ import annotations

import json
import time
from typing import Any

import pika

from ..config import get_settings
from ..database import SessionLocal, init_db
from ..services.invoice_service import create_or_update_invoice


class AccountingConsumer:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._accepted_events = {event.lower() for event in self.settings.accepted_order_events}

    def _extract_event_name(self, payload: dict[str, Any], routing_key: str, message_type: str | None) -> str:
        return (
            str(payload.get("event_type") or payload.get("event") or payload.get("type") or message_type or routing_key)
            .strip()
        )

    def _declare_topology(self, channel: pika.adapters.blocking_connection.BlockingChannel) -> None:
        channel.exchange_declare(
            exchange=self.settings.rabbitmq_exchange,
            exchange_type=self.settings.rabbitmq_exchange_type,
            durable=True,
        )
        channel.queue_declare(queue=self.settings.rabbitmq_queue, durable=True)

        for routing_key in self.settings.rabbitmq_routing_keys:
            channel.queue_bind(
                exchange=self.settings.rabbitmq_exchange,
                queue=self.settings.rabbitmq_queue,
                routing_key=routing_key,
            )

        channel.basic_qos(prefetch_count=1)

    def _handle_message(self, channel, method, properties, body: bytes) -> None:
        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            print(f"[accounting-consumer] Invalid JSON payload dropped: {exc}")
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        if not isinstance(payload, dict):
            print("[accounting-consumer] Payload is not a JSON object and was dropped.")
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        event_name = self._extract_event_name(payload, method.routing_key, getattr(properties, "type", None))
        if event_name.lower() not in self._accepted_events and method.routing_key.lower() not in self._accepted_events:
            print(f"[accounting-consumer] Ignored event '{event_name}' with routing key '{method.routing_key}'.")
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        try:
            with SessionLocal() as db:
                invoice, created, _ = create_or_update_invoice(db, payload, source="rabbitmq")
            state = "created" if created else "updated"
            print(
                f"[accounting-consumer] Invoice {invoice.invoice_number} {state} "
                f"for order {invoice.order_id}."
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
        except ValueError as exc:
            print(f"[accounting-consumer] Invalid event payload dropped: {exc}")
            channel.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as exc:
            print(f"[accounting-consumer] Failed to process message: {exc}")
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def start(self) -> None:
        init_db()

        while True:
            connection = None
            try:
                parameters = pika.URLParameters(self.settings.rabbitmq_url)
                connection = pika.BlockingConnection(parameters)
                channel = connection.channel()
                self._declare_topology(channel)
                channel.basic_consume(
                    queue=self.settings.rabbitmq_queue,
                    on_message_callback=self._handle_message,
                )

                print(
                    "[accounting-consumer] Listening for events on queue "
                    f"'{self.settings.rabbitmq_queue}'."
                )
                channel.start_consuming()
            except KeyboardInterrupt:
                print("[accounting-consumer] Consumer stopped by user.")
                break
            except Exception as exc:
                print(
                    f"[accounting-consumer] Connection error: {exc}. "
                    f"Retrying in {self.settings.reconnect_delay_seconds} seconds."
                )
                time.sleep(self.settings.reconnect_delay_seconds)
            finally:
                if connection and connection.is_open:
                    connection.close()
