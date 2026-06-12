from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(100), nullable=False)
    customer_phone = Column(String(20), default="")
    shipping_address = Column(String(500), default="")
    total_amount = Column(Integer, default=0)
    status = Column(String(20), default="pending")  # pending | confirmed | cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship: one order has many items
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", order_by="OrderItem.id")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, nullable=False)
    product_name = Column(String(100), default="")
    quantity = Column(Integer, default=1)
    price = Column(Integer, default=0)
    subtotal = Column(Integer, default=0)

    # Relationship back to order
    order = relationship("Order", back_populates="items")


class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    __table_args__ = (
        UniqueConstraint("aggregate_type", "aggregate_id", "event_type", name="uq_outbox_aggregate_event"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    aggregate_type = Column(String(64), nullable=False, index=True)
    aggregate_id = Column(String(64), nullable=False, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    payload = Column(Text, nullable=False)
    status = Column(String(16), nullable=False, default="pending", index=True)
    attempt_count = Column(Integer, nullable=False, default=0)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    published_at = Column(DateTime, nullable=True)
