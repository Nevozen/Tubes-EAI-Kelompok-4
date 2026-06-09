from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    database_url: str
    rabbitmq_queue: str
    accepted_events: list[str]


class InvoiceItemResponse(BaseModel):
    id: int
    sku: str | None = None
    product_name: str
    quantity: int
    unit_price: float
    line_total: float


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    order_id: str
    event_name: str
    customer_id: str | None = None
    customer_name: str | None = None
    customer_email: str | None = None
    currency: str
    status: str
    subtotal: float
    tax_amount: float
    shipping_amount: float
    grand_total: float
    issued_at: datetime
    source: str
    xml_payload: str
    created_at: datetime
    updated_at: datetime
    items: list[InvoiceItemResponse]


class InvoiceMutationResponse(BaseModel):
    message: str
    created: bool
    invoice: InvoiceResponse


class InvoiceListResponse(BaseModel):
    total: int
    items: list[InvoiceResponse]


class RawEventPreviewResponse(BaseModel):
    normalized_order_id: str = Field(..., description="Order ID extracted from the incoming payload")
    normalized_event_name: str = Field(..., description="Event name detected by the internal mapper")
    xml_preview: str
    source_payload: dict[str, Any]
