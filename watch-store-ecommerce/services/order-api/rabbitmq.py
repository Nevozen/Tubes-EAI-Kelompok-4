import json
import logging
import os

import pika
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")
EXCHANGE_NAME = os.getenv("RABBITMQ_EXCHANGE", "watchcommerce.events")
EXCHANGE_TYPE = os.getenv("RABBITMQ_EXCHANGE_TYPE", "topic")
ROUTING_KEY = os.getenv("RABBITMQ_ROUTING_KEY", "order.created")
MESSAGE_TYPE = os.getenv("RABBITMQ_MESSAGE_TYPE", "OrderCreated")


def _build_rabbitmq_url() -> str:
    if RABBITMQ_URL:
        return RABBITMQ_URL
    return f"amqp://{RABBITMQ_USER}:{RABBITMQ_PASS}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/%2F"


def get_connection():
    parameters = pika.URLParameters(_build_rabbitmq_url())
    parameters.heartbeat = 600
    parameters.blocked_connection_timeout = 300
    return pika.BlockingConnection(parameters)


def publish_order_created(order_data: dict):
    connection = None
    try:
        connection = get_connection()
        channel = connection.channel()
        channel.exchange_declare(
            exchange=EXCHANGE_NAME,
            exchange_type=EXCHANGE_TYPE,
            durable=True,
        )

        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=ROUTING_KEY,
            body=json.dumps(order_data, default=str),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type="application/json",
                type=MESSAGE_TYPE,
            ),
        )

        logger.info(
            "Published %s event for order %s using routing key %s",
            MESSAGE_TYPE,
            order_data["data"]["order_id"],
            ROUTING_KEY,
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
