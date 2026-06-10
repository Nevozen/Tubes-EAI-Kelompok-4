import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./crm.db")
    RABBITMQ_HOST: str = os.getenv("RABBITMQ_HOST", "localhost")
    RABBITMQ_USER: str = os.getenv("RABBITMQ_USER", "watchcommerce")
    RABBITMQ_PASSWORD: str = os.getenv("RABBITMQ_PASSWORD", "watchcommerce")
    RABBITMQ_QUEUE: str = os.getenv("RABBITMQ_QUEUE", "integration.crm.order.created")
    RABBITMQ_EXCHANGE: str = os.getenv("RABBITMQ_EXCHANGE", "watchcommerce.events")


settings = Settings()
