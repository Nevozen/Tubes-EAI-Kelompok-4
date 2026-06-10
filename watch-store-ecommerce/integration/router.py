import os
import time

from common import (
    create_connection,
    csv_env,
    decode_json,
    declare_exchange,
    publish_json,
    validate_order_created_payload,
)

EXCHANGE_NAME = os.getenv("RABBITMQ_EXCHANGE", "watchcommerce.events")
EXCHANGE_TYPE = os.getenv("RABBITMQ_EXCHANGE_TYPE", "topic")
QUEUE_NAME = os.getenv("RABBITMQ_QUEUE", "integration.router.order.created")
BINDING_KEYS = csv_env("RABBITMQ_BINDING_KEYS", ["order.created"])
OUTGOING_KEYS = csv_env(
    "ROUTER_OUTGOING_KEYS",
    [
        "integration.inventory.order.created",
        "integration.accounting.order.created",
        "integration.crm.order.created",
    ],
)
ACCEPTED_EVENT_TYPES = {item.lower() for item in csv_env("ACCEPTED_EVENT_TYPES", ["OrderCreated"])}
RECONNECT_DELAY = int(os.getenv("RABBITMQ_RECONNECT_DELAY", "5"))


def callback(channel, method, properties, body: bytes) -> None:
    try:
        payload = decode_json(body)
        validate_order_created_payload(payload, ACCEPTED_EVENT_TYPES)
    except ValueError as exc:
        print(f"[integration-router] Dropped invalid payload: {exc}")
        channel.basic_ack(delivery_tag=method.delivery_tag)
        return

    message_type = str(payload.get("event_type", "OrderCreated"))

    try:
        for routing_key in OUTGOING_KEYS:
            publish_json(channel, EXCHANGE_NAME, routing_key, payload, message_type)
        print(
            f"[integration-router] Routed order {payload['data']['order_id']} "
            f"to {', '.join(OUTGOING_KEYS)}."
        )
        channel.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as exc:
        print(f"[integration-router] Failed to route payload: {exc}")
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
            print(f"[integration-router] Listening on {QUEUE_NAME} for {', '.join(BINDING_KEYS)}.")
            channel.start_consuming()
        except KeyboardInterrupt:
            print("[integration-router] Stopped by user.")
            break
        except Exception as exc:
            print(f"[integration-router] Connection error: {exc}. Retrying in {RECONNECT_DELAY}s.")
            time.sleep(RECONNECT_DELAY)
        finally:
            if connection and connection.is_open:
                connection.close()


if __name__ == "__main__":
    start()
