from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from .database import Base


class PurchaseHistory(Base):
    __tablename__ = "purchase_histories"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(64), nullable=False, unique=True, index=True)
    customer_id = Column(String(100), nullable=True, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(120), nullable=True, index=True)
    total_price = Column(Float, nullable=False)
    status = Column(String(32), nullable=False, default="CONFIRMED")
    item_count = Column(Integer, nullable=False, default=0)
    raw_event = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
