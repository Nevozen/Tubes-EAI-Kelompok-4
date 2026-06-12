from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


# ── Request Schemas ──────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    """Single item in a checkout request."""
    product_id: int
    product_name: str
    quantity: int
    price: int


class CheckoutRequest(BaseModel):
    """
    Payload sent by the customer/frontend when placing an order.

    Example:
    {
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "customer_phone": "081234567890",
        "shipping_address": "Jl. Merdeka No. 10, Bandung",
        "items": [
            { "product_id": 1, "product_name": "White Decade", "quantity": 1, "price": 12450000 },
            { "product_id": 3, "product_name": "Cool Decade", "quantity": 2, "price": 1100000 }
        ]
    }
    """
    customer_name: str
    customer_email: str
    customer_phone: str = ""
    shipping_address: str = ""
    items: List[OrderItemCreate]


class StatusUpdateRequest(BaseModel):
    """Request body for updating order status."""
    status: str  # pending | confirmed | cancelled


# ── Response Schemas ─────────────────────────────────────────────

class OrderItemResponse(BaseModel):
    """Response schema for a single order item."""
    id: int
    order_id: int
    product_id: int
    product_name: str
    quantity: int
    price: int
    subtotal: int

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    """Full order response including its items."""
    id: int
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    total_amount: int
    status: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


class OutboxEventResponse(BaseModel):
    event_id: int
    aggregate_type: str
    aggregate_id: str
    event_type: str
    payload: dict[str, Any]
    status: str
    attempt_count: int
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None


class OutboxSummaryResponse(BaseModel):
    total: int
    pending: int
    published: int
    failed: int


class OutboxListResponse(BaseModel):
    summary: OutboxSummaryResponse
    items: List[OutboxEventResponse]


class OutboxRetryResponse(BaseModel):
    message: str
    event: OutboxEventResponse
