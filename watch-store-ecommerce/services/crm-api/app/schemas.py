from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PurchaseHistoryResponse(BaseModel):
    id: int
    order_id: str
    customer_id: Optional[str] = None
    customer_name: str
    customer_email: Optional[str] = None
    total_price: float
    status: str
    item_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PurchaseMutationResponse(BaseModel):
    message: str
    created: bool
    purchase: PurchaseHistoryResponse
