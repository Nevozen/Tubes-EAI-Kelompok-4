from pydantic import BaseModel
from typing import Optional

class InventoryBase(BaseModel):
    product_name: str
    sku: str = ""
    category: str = "Gentle"
    series: str = "Modern"
    price: int = 0
    description: str = ""
    image: str = ""
    stock: int
    reserved: int = 0

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    product_name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    series: Optional[str] = None
    price: Optional[int] = None
    description: Optional[str] = None
    image: Optional[str] = None
    stock: Optional[int] = None
    reserved: Optional[int] = None

class Inventory(InventoryBase):
    id: int

    class Config:
        orm_mode = True

# Schemas for action endpoints
class ReserveRequest(BaseModel):
    product_id: int
    quantity: int

class DeductRequest(BaseModel):
    product_id: int
    quantity: int

class RestockRequest(BaseModel):
    product_id: int
    quantity: int
