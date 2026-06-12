from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from config import get_settings

settings = get_settings()

# SQLite requires check_same_thread=False to work with FastAPI's threading
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(
    settings.database_url, connect_args=connect_args
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
