from __future__ import annotations

from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db, init_db
from .schemas import (
    HealthResponse,
    InvoiceListResponse,
    InvoiceMutationResponse,
    InvoiceResponse,
    RawEventPreviewResponse,
)
from .services.invoice_service import (
    build_invoice_document,
    create_or_update_invoice,
    get_invoice_by_id,
    get_invoice_by_order_id,
    list_invoices,
    normalize_order_event,
    serialize_invoice,
)
from .services.xml_transformer import build_invoice_xml


settings = get_settings()
app = FastAPI(title=settings.app_name, version=settings.app_version)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get(f"{settings.api_prefix}/health", response_model=HealthResponse)
def healthcheck() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "database_configured": bool(settings.database_url),
        "rabbitmq_queue": settings.rabbitmq_queue,
        "accepted_events": settings.accepted_order_events,
    }


@app.post(
    f"{settings.api_prefix}/internal/order-events/order-created/preview",
    response_model=RawEventPreviewResponse,
)
def preview_order_created_event(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        normalized = normalize_order_event(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    invoice_number = "INV-PREVIEW"
    xml_preview = build_invoice_xml(build_invoice_document(normalized, invoice_number))

    return {
        "normalized_order_id": normalized.order_id,
        "normalized_event_name": normalized.event_name,
        "xml_preview": xml_preview,
        "source_payload": payload,
    }


@app.post(
    f"{settings.api_prefix}/internal/order-events/order-created",
    response_model=InvoiceMutationResponse,
)
def consume_order_created_event(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        invoice, created, _ = create_or_update_invoice(db, payload, source="integration-adapter")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    message = "Invoice created from OrderCreated event." if created else "Existing invoice refreshed from event."
    return {
        "message": message,
        "created": created,
        "invoice": serialize_invoice(invoice),
    }


@app.get(f"{settings.api_prefix}/invoices", response_model=InvoiceListResponse)
def fetch_invoices(
    limit: int = Query(default=settings.page_size_default, ge=1),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    safe_limit = min(limit, settings.page_size_max)
    invoices, total = list_invoices(db, limit=safe_limit, offset=offset)
    return {
        "total": total,
        "items": [serialize_invoice(invoice) for invoice in invoices],
    }


@app.get(f"{settings.api_prefix}/invoices/by-order/{{order_id}}", response_model=InvoiceResponse)
def fetch_invoice_by_order(order_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    invoice = get_invoice_by_order_id(db, order_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice untuk order tersebut tidak ditemukan.")
    return serialize_invoice(invoice)


@app.get(f"{settings.api_prefix}/invoices/{{invoice_id}}", response_model=InvoiceResponse)
def fetch_invoice_by_id(invoice_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    invoice = get_invoice_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan.")
    return serialize_invoice(invoice)


@app.get(f"{settings.api_prefix}/invoices/{{invoice_id}}/xml")
def fetch_invoice_xml(invoice_id: int, db: Session = Depends(get_db)) -> Response:
    invoice = get_invoice_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan.")
    return Response(content=invoice.xml_payload, media_type="application/xml")


@app.get(f"{settings.api_prefix}/invoices/{{invoice_id}}/pdf")
def fetch_invoice_pdf(invoice_id: int, db: Session = Depends(get_db)) -> Response:
    invoice = get_invoice_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan.")
    
    from .services.pdf_generator import build_invoice_pdf
    try:
        pdf_bytes = bytes(build_invoice_pdf(invoice))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gagal generate PDF: {str(exc)}") from exc
        
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=invoice-{invoice.invoice_number}.pdf"}
    )

