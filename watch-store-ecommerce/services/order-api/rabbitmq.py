import os
import json
import logging
import pika
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── RabbitMQ Configuration (from environment variables) ──────────
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")

# Exchange name — fanout type for Publish-Subscribe pattern
EXCHANGE_NAME = os.getenv("RABBITMQ_EXCHANGE", "order_exchange")


def get_connection():
    """
    Create a blocking connection to RabbitMQ.
    Uses credentials and host from environment variables.
    """
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials,
        # Heartbeat and timeout for robustness
        heartbeat=600,
        blocked_connection_timeout=300,
    )
    return pika.BlockingConnection(parameters)


def publish_order_created(order_data: dict):
    """
    Publish an OrderCreated event to RabbitMQ.

    Uses a FANOUT exchange so that all bound queues (Inventory, Accounting, CRM)
    receive a copy of the message — implementing the Publish-Subscribe pattern.

    EIP Patterns applied:
      - Message Channel: the exchange acts as the channel
      - Publish-Subscribe: fanout exchange delivers to all consumers
      - Message Endpoint: this function is the producer endpoint

    Args:
        order_data: Dictionary containing the order information to publish.
    """
    connection = None
    try:
        connection = get_connection()
        channel = connection.channel()

        # Declare the exchange (idempotent — safe to call multiple times)
        # Type 'fanout' broadcasts to ALL bound queues
        channel.exchange_declare(
            exchange=EXCHANGE_NAME,
            exchange_type="fanout",
            durable=True,  # Survives broker restart
        )

        # Build the event message
        message = json.dumps(order_data, default=str)

        # Publish with persistent delivery mode so messages survive restart
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key="",  # Fanout ignores routing key
            body=message,
            properties=pika.BasicProperties(
                delivery_mode=2,  # Persistent message
                content_type="application/json",
            ),
        )

        logger.info(f"Published OrderCreated event for order #{order_data['data']['order_id']}")

    except pika.exceptions.AMQPConnectionError as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")
        raise Exception(f"RabbitMQ connection failed: {e}")
    except Exception as e:
        logger.error(f"Failed to publish message: {e}")
        raise
    finally:
        if connection and not connection.is_closed:
            connection.close()
