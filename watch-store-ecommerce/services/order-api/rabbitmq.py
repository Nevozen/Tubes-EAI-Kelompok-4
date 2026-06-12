import json
import logging

import pika
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_connection():
    parameters = pika.URLParameters(settings.rabbitmq_url)
    parameters.heartbeat = 600
    parameters.blocked_connection_timeout = 300
    return pika.BlockingConnection(parameters)


def publish_event(payload: dict, routing_key: str | None = None, message_type: str | None = None) -> None:
    connection = None
    try:
        connection = get_connection()
        channel = connection.channel()
        channel.exchange_declare(
            exchange=settings.rabbitmq_exchange,
            exchange_type=settings.rabbitmq_exchange_type,
            durable=True,
        )

        channel.basic_publish(
            exchange=settings.rabbitmq_exchange,
            routing_key=routing_key or settings.rabbitmq_routing_key,
            body=json.dumps(payload, default=str),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type="application/json",
                type=message_type or settings.rabbitmq_message_type,
            ),
        )

        logger.info(
            "Published %s event for order %s using routing key %s",
            message_type or settings.rabbitmq_message_type,
            payload["data"]["order_id"],
            routing_key or settings.rabbitmq_routing_key,
        )
    except pika.exceptions.AMQPConnectionError as exc:
        logger.error("Failed to connect to RabbitMQ: %s", exc)
        raise Exception(f"RabbitMQ connection failed: {exc}") from exc
    except Exception as exc:
        logger.error("Failed to publish message: %s", exc)
        raise
    finally:
        if connection and not connection.is_closed:
            connection.close()


def publish_order_created(order_data: dict) -> None:
    publish_event(order_data, routing_key=settings.rabbitmq_routing_key, message_type=settings.rabbitmq_message_type)
