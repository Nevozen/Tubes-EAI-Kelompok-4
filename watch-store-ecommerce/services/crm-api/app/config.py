import os
from pathlib import Path
from dotenv import load_dotenv

# Load file .env dari root folder crm-api jika ada
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./crm.db")
    RABBITMQ_HOST: str = os.getenv("RABBITMQ_HOST", "localhost")
    RABBITMQ_USER: str = os.getenv("RABBITMQ_USER", "guest")
    RABBITMQ_PASSWORD: str = os.getenv("RABBITMQ_PASSWORD", "guest")
    RABBITMQ_QUEUE: str = os.getenv("RABBITMQ_QUEUE", "crm_order_queue")
    RABBITMQ_EXCHANGE: str = os.getenv("RABBITMQ_EXCHANGE", "order.created")


settings = Settings()
