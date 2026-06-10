from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class ProductInventory(Base):
    __tablename__ = "product_inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(100), index=True)
    sku = Column(String(50), default="", index=True)
    category = Column(String(50), default="Gentle")
    series = Column(String(50), default="Modern")
    price = Column(Integer, default=0)
    description = Column(String(1000), default="")
    image = Column(String(500), default="")
    stock = Column(Integer, default=0)
    reserved = Column(Integer, default=0)


class InventoryReservation(Base):
    __tablename__ = "inventory_reservations"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(64), unique=True, nullable=False, index=True)
    event_name = Column(String(64), nullable=False, default="OrderCreated")
    status = Column(String(32), nullable=False, default="RESERVED")
    customer_email = Column(String(120), nullable=True)
    total_items = Column(Integer, nullable=False, default=0)
    raw_event = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship(
        "InventoryReservationItem",
        back_populates="reservation",
        cascade="all, delete-orphan",
        order_by="InventoryReservationItem.id",
    )


class InventoryReservationItem(Base):
    __tablename__ = "inventory_reservation_items"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("inventory_reservations.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, nullable=False, index=True)
    product_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Integer, nullable=False, default=0)
    line_total = Column(Integer, nullable=False, default=0)

    reservation = relationship("InventoryReservation", back_populates="items")
