import os
import time

import httpx

from common import (
    create_connection,
    csv_env,
    decode_json,
    declare_exchange,
    validate_order_created_payload,
)

ADAPTER_NAME = os.getenv("ADAPTER_NAME", "adapter")
EXCHANGE_NAME = os.getenv("RABBITMQ_EXCHANGE", "watchcommerce.events")
EXCHANGE_TYPE = os.getenv("RABBITMQ_EXCHANGE_TYPE", "topic")
QUEUE_NAME = os.getenv("RABBITMQ_QUEUE", f"integration.{ADAPTER_NAME}.order.created")
BINDING_KEYS = csv_env("RABBITMQ_BINDING_KEYS", [f"integration.{ADAPTER_NAME}.order.created"])
ACCEPTED_EVENT_TYPES = {item.lower() for item in csv_env("ACCEPTED_EVENT_TYPES", ["OrderCreated"])}
TARGET_URL = os.getenv("TARGET_URL", "http://localhost")
TARGET_TIMEOUT = float(os.getenv("TARGET_TIMEOUT_SECONDS", "15"))
RECONNECT_DELAY = int(os.getenv("RABBITMQ_RECONNECT_DELAY", "5"))


def callback(channel, method, properties, body: bytes) -> None:
    try:
        payload = decode_json(body)
        validate_order_created_payload(payload, ACCEPTED_EVENT_TYPES)
    except ValueError as exc:
        print(f"[{ADAPTER_NAME}-adapter] Dropped invalid payload: {exc}")
        channel.basic_ack(delivery_tag=method.delivery_tag)
        return

    try:
        with httpx.Client(timeout=TARGET_TIMEOUT) as client:
            response = client.post(TARGET_URL, json=payload)

        if response.status_code < 300:
            print(
                f"[{ADAPTER_NAME}-adapter] Delivered order {payload['data']['order_id']} "
                f"to {TARGET_URL}."
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        if response.status_code < 500:
            print(
                f"[{ADAPTER_NAME}-adapter] Dropped payload for order {payload['data']['order_id']} "
                f"because target returned {response.status_code}: {response.text}"
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        print(
            f"[{ADAPTER_NAME}-adapter] Target returned {response.status_code}. "
            "Message will be retried."
        )
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    except Exception as exc:
        print(f"[{ADAPTER_NAME}-adapter] Delivery error: {exc}")
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def start() -> None:
    while True:
        connection = None
        try:
            connection = create_connection()
            channel = connection.channel()
            declare_exchange(channel, EXCHANGE_NAME, EXCHANGE_TYPE)
            channel.queue_declare(queue=QUEUE_NAME, durable=True)
            for binding_key in BINDING_KEYS:
                channel.queue_bind(exchange=EXCHANGE_NAME, queue=QUEUE_NAME, routing_key=binding_key)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)
            print(f"[{ADAPTER_NAME}-adapter] Listening on {QUEUE_NAME} for {', '.join(BINDING_KEYS)}.")
            channel.start_consuming()
        except KeyboardInterrupt:
            print(f"[{ADAPTER_NAME}-adapter] Stopped by user.")
            break
        except Exception as exc:
            print(f"[{ADAPTER_NAME}-adapter] Connection error: {exc}. Retrying in {RECONNECT_DELAY}s.")
            time.sleep(RECONNECT_DELAY)
        finally:
            if connection and connection.is_open:
                connection.close()


if __name__ == "__main__":
    start()
