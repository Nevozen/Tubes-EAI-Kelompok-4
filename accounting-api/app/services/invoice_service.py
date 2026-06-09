from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from ..config import get_settings
from .xml_transformer import build_invoice_xml


TWOPLACES = Decimal("0.01")


@dataclass
class NormalizedOrderItem:
    sku: str | None
    product_name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


@dataclass
class NormalizedOrderEvent:
    event_name: str
    order_id: str
    customer_id: str | None
    customer_name: str | None
    customer_email: str | None
    currency: str
    status: str
    subtotal: Decimal
    tax_amount: Decimal
    shipping_amount: Decimal
    grand_total: Decimal
    ordered_at: datetime
    items: list[NormalizedOrderItem]
    raw_payload: dict[str, Any]


def _to_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _to_decimal(value: Any, default: Decimal = Decimal("0.00")) -> Decimal:
    if value in (None, ""):
        return default

    if isinstance(value, Decimal):
        return value.quantize(TWOPLACES)

    if isinstance(value, (int, float)):
        return Decimal(str(value)).quantize(TWOPLACES)

    if isinstance(value, str):
        cleaned = value.replace(",", "").strip()
        if not cleaned:
            return default
        try:
            return Decimal(cleaned).quantize(TWOPLACES)
        except InvalidOperation:
            return default

    return default


def _to_int(value: Any, default: int = 0) -> int:
    if value in (None, ""):
        return default

    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _coalesce(*values: Any) -> Any:
    for value in values:
        if value not in (None, ""):
            return value
    return None


def _parse_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value

    if isinstance(value, str) and value.strip():
        candidate = value.strip().replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(candidate)
        except ValueError:
            pass

    return datetime.utcnow()


def _extract_order_payload(payload: dict[str, Any]) -> dict[str, Any]:
    if isinstance(payload.get("data"), dict):
        return payload["data"]
    if isinstance(payload.get("order"), dict):
        return payload["order"]
    if isinstance(payload.get("payload"), dict):
        return payload["payload"]
    return payload


def _normalize_items(raw_items: Any) -> list[NormalizedOrderItem]:
    items: list[NormalizedOrderItem] = []

    if not isinstance(raw_items, list):
        return items

    for raw_item in raw_items:
        if not isinstance(raw_item, dict):
            continue

        sku = _to_text(_coalesce(raw_item.get("sku"), raw_item.get("product_code")))
        product_name = _to_text(
            _coalesce(
                raw_item.get("product_name"),
                raw_item.get("name"),
                raw_item.get("title"),
                raw_item.get("product_id"),
                sku,
            )
        ) or "Unknown Item"
        quantity = _to_int(_coalesce(raw_item.get("quantity"), raw_item.get("qty"), 1), default=1)
        unit_price = _to_decimal(
            _coalesce(raw_item.get("unit_price"), raw_item.get("price"), raw_item.get("amount"))
        )
        line_total = _to_decimal(
            _coalesce(raw_item.get("line_total"), raw_item.get("subtotal"), raw_item.get("total"))
        )

        if line_total == Decimal("0.00"):
            line_total = (unit_price * quantity).quantize(TWOPLACES)

        items.append(
            NormalizedOrderItem(
                sku=sku,
                product_name=product_name,
                quantity=quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    return items


def normalize_order_event(payload: dict[str, Any]) -> NormalizedOrderEvent:
    if not isinstance(payload, dict):
        raise ValueError("Payload event harus berupa JSON object.")

    settings = get_settings()
    order_payload = _extract_order_payload(payload)
    customer_payload = order_payload.get("customer") if isinstance(order_payload.get("customer"), dict) else {}

    order_id = _to_text(
        _coalesce(
            order_payload.get("order_id"),
            order_payload.get("id"),
            order_payload.get("orderId"),
        )
    )
    if not order_id:
        raise ValueError("Payload tidak memiliki order_id yang valid.")

    event_name = _to_text(
        _coalesce(payload.get("event_type"), payload.get("event"), payload.get("type"), "OrderCreated")
    ) or "OrderCreated"

    items = _normalize_items(
        _coalesce(
            order_payload.get("items"),
            order_payload.get("order_items"),
            order_payload.get("products"),
            [],
        )
    )

    subtotal = _to_decimal(_coalesce(order_payload.get("subtotal"), order_payload.get("sub_total")))
    if subtotal == Decimal("0.00"):
        subtotal = sum((item.line_total for item in items), Decimal("0.00")).quantize(TWOPLACES)

    tax_amount = _to_decimal(_coalesce(order_payload.get("tax_amount"), order_payload.get("tax")))
    shipping_amount = _to_decimal(
        _coalesce(order_payload.get("shipping_amount"), order_payload.get("shipping_cost"))
    )
    grand_total = _to_decimal(
        _coalesce(
            order_payload.get("grand_total"),
            order_payload.get("total_amount"),
            order_payload.get("total"),
            order_payload.get("amount_paid"),
        )
    )
    if grand_total == Decimal("0.00"):
        grand_total = (subtotal + tax_amount + shipping_amount).quantize(TWOPLACES)

    return NormalizedOrderEvent(
        event_name=event_name,
        order_id=order_id,
        customer_id=_to_text(
            _coalesce(order_payload.get("customer_id"), order_payload.get("customerId"), customer_payload.get("id"))
        ),
        customer_name=_to_text(
            _coalesce(
                order_payload.get("customer_name"),
                order_payload.get("customerName"),
                customer_payload.get("name"),
                customer_payload.get("full_name"),
            )
        ),
        customer_email=_to_text(
            _coalesce(
                order_payload.get("customer_email"),
                order_payload.get("customerEmail"),
                customer_payload.get("email"),
            )
        ),
        currency=_to_text(_coalesce(order_payload.get("currency"), settings.invoice_currency_default))
        or settings.invoice_currency_default,
        status=(_to_text(_coalesce(order_payload.get("payment_status"), order_payload.get("status"))) or "UNPAID").upper(),
        subtotal=subtotal,
        tax_amount=tax_amount,
        shipping_amount=shipping_amount,
        grand_total=grand_total,
        ordered_at=_parse_datetime(
            _coalesce(order_payload.get("created_at"), order_payload.get("ordered_at"), payload.get("occurred_at"))
        ),
        items=items,
        raw_payload=payload,
    )


def generate_invoice_number(order_id: str, issued_at: datetime) -> str:
    safe_order = re.sub(r"[^A-Za-z0-9]", "", order_id).upper()[-6:] or "ORDER"
    return f"INV-{issued_at:%Y%m%d%H%M%S}-{safe_order}"


def build_invoice_document(normalized: NormalizedOrderEvent, invoice_number: str) -> dict[str, Any]:
    return {
        "invoice_number": invoice_number,
        "event_name": normalized.event_name,
        "order_id": normalized.order_id,
        "issued_at": normalized.ordered_at.isoformat(),
        "customer": {
            "customer_id": normalized.customer_id,
            "customer_name": normalized.customer_name,
            "customer_email": normalized.customer_email,
        },
        "amounts": {
            "currency": normalized.currency,
            "subtotal": f"{normalized.subtotal:.2f}",
            "tax_amount": f"{normalized.tax_amount:.2f}",
            "shipping_amount": f"{normalized.shipping_amount:.2f}",
            "grand_total": f"{normalized.grand_total:.2f}",
            "status": normalized.status,
        },
        "items": [
            {
                "sku": item.sku,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": f"{item.unit_price:.2f}",
                "line_total": f"{item.line_total:.2f}",
            }
            for item in normalized.items
        ],
    }


def create_or_update_invoice(
    db: Session,
    payload: dict[str, Any],
    source: str = "api",
) -> tuple[models.Invoice, bool, NormalizedOrderEvent]:
    normalized = normalize_order_event(payload)

    invoice = db.query(models.Invoice).filter(models.Invoice.order_id == normalized.order_id).first()
    created = invoice is None

    if created:
        invoice = models.Invoice(
            invoice_number=generate_invoice_number(normalized.order_id, normalized.ordered_at),
            order_id=normalized.order_id,
            xml_payload="",
            raw_event="{}",
        )
        db.add(invoice)

    invoice.event_name = normalized.event_name
    invoice.customer_id = normalized.customer_id
    invoice.customer_name = normalized.customer_name
    invoice.customer_email = normalized.customer_email
    invoice.currency = normalized.currency
    invoice.status = normalized.status
    invoice.subtotal = normalized.subtotal
    invoice.tax_amount = normalized.tax_amount
    invoice.shipping_amount = normalized.shipping_amount
    invoice.grand_total = normalized.grand_total
    invoice.issued_at = normalized.ordered_at
    invoice.source = source
    invoice.raw_event = json.dumps(payload, ensure_ascii=True)

    document = build_invoice_document(normalized, invoice.invoice_number)
    invoice.xml_payload = build_invoice_xml(document)

    invoice.items.clear()
    for item in normalized.items:
        invoice.items.append(
            models.InvoiceItem(
                sku=item.sku,
                product_name=item.product_name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
            )
        )

    db.commit()
    db.refresh(invoice)
    return invoice, created, normalized


def list_invoices(db: Session, limit: int, offset: int) -> tuple[list[models.Invoice], int]:
    total = db.query(models.Invoice).count()
    items = (
        db.query(models.Invoice)
        .order_by(models.Invoice.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return items, total


def get_invoice_by_id(db: Session, invoice_id: int) -> models.Invoice | None:
    return db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()


def get_invoice_by_order_id(db: Session, order_id: str) -> models.Invoice | None:
    return db.query(models.Invoice).filter(models.Invoice.order_id == order_id).first()


def serialize_invoice(invoice: models.Invoice) -> dict[str, Any]:
    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "order_id": invoice.order_id,
        "event_name": invoice.event_name,
        "customer_id": invoice.customer_id,
        "customer_name": invoice.customer_name,
        "customer_email": invoice.customer_email,
        "currency": invoice.currency,
        "status": invoice.status,
        "subtotal": float(invoice.subtotal or 0),
        "tax_amount": float(invoice.tax_amount or 0),
        "shipping_amount": float(invoice.shipping_amount or 0),
        "grand_total": float(invoice.grand_total or 0),
        "issued_at": invoice.issued_at,
        "source": invoice.source,
        "xml_payload": invoice.xml_payload,
        "created_at": invoice.created_at,
        "updated_at": invoice.updated_at,
        "items": [
            {
                "id": item.id,
                "sku": item.sku,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price or 0),
                "line_total": float(item.line_total or 0),
            }
            for item in invoice.items
        ],
    }
