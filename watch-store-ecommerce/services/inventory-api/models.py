from sqlalchemy import Column, Integer, String
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
