import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv


def _load_nearest_env() -> None:
    for directory in (Path(__file__).resolve().parent, *Path(__file__).resolve().parents):
        env_path = directory / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            return
    load_dotenv()


_load_nearest_env()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not SQLALCHEMY_DATABASE_URL:
    raise RuntimeError("Missing required environment variable: DATABASE_URL")

# SQLite requires this connect_args to avoid threading issues
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
