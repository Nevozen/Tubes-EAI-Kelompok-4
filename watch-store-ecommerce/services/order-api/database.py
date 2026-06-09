import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Default to sqlite for local dev; override via DATABASE_URL env var
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./order.db")

# SQLite requires check_same_thread=False to work with FastAPI's threading
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency for FastAPI route injection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
