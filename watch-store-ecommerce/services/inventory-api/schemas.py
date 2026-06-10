from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


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
        from_attributes = True


class ReserveRequest(BaseModel):
    product_id: int
    quantity: int


class DeductRequest(BaseModel):
    product_id: int
    quantity: int


class RestockRequest(BaseModel):
    product_id: int
    quantity: int


class InventoryReservationItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: int
    line_total: int

    class Config:
        from_attributes = True


class InventoryReservationResponse(BaseModel):
    id: int
    order_id: str
    event_name: str
    status: str
    customer_email: Optional[str] = None
    total_items: int
    created_at: datetime
    updated_at: datetime
    items: List[InventoryReservationItemResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class InventoryReservationMutationResponse(BaseModel):
    message: str
    created: bool
    reservation: InventoryReservationResponse
