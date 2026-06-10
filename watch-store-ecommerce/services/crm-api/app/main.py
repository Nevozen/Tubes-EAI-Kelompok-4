import json
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import PurchaseHistory
from .schemas import PurchaseHistoryResponse, PurchaseMutationResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CRM API",
    description="Owns customer purchase history for WatchCommerce.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _coalesce(*values: Any) -> Any:
    for value in values:
        if value not in (None, ""):
            return value
    return None


def _extract_order_payload(payload: dict[str, Any]) -> dict[str, Any]:
    if isinstance(payload.get("data"), dict):
        return payload["data"]
    if isinstance(payload.get("order"), dict):
        return payload["order"]
    return payload


def _normalize_order_event(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Payload event harus berupa JSON object.")

    order_payload = _extract_order_payload(payload)
    raw_items = order_payload.get("items") if isinstance(order_payload.get("items"), list) else []

    order_id = str(_coalesce(order_payload.get("order_id"), order_payload.get("id"), order_payload.get("orderId")) or "").strip()
    if not order_id:
        raise ValueError("Payload tidak memiliki order_id yang valid.")

    customer_email = _coalesce(
        order_payload.get("customer_email"),
        order_payload.get("customerEmail"),
        order_payload.get("customer_id"),
    )
    customer_name = _coalesce(order_payload.get("customer_name"), order_payload.get("customerName"))
    if not customer_name:
        raise ValueError("Payload tidak memiliki customer_name yang valid.")

    return {
        "order_id": order_id,
        "customer_id": _coalesce(order_payload.get("customer_id"), customer_email),
        "customer_name": str(customer_name),
        "customer_email": str(customer_email) if customer_email else None,
        "total_price": float(
            _coalesce(
                order_payload.get("grand_total"),
                order_payload.get("total_amount"),
                order_payload.get("total"),
                0,
            )
            or 0
        ),
        "status": str(_coalesce(order_payload.get("status"), "CONFIRMED")).upper(),
        "item_count": len(raw_items),
        "raw_event": payload,
    }


def _serialize_purchase(purchase: PurchaseHistory) -> dict[str, Any]:
    return {
        "id": purchase.id,
        "order_id": purchase.order_id,
        "customer_id": purchase.customer_id,
        "customer_name": purchase.customer_name,
        "customer_email": purchase.customer_email,
        "total_price": purchase.total_price,
        "status": purchase.status,
        "item_count": purchase.item_count,
        "created_at": purchase.created_at,
        "updated_at": purchase.updated_at,
    }


@app.get("/")
def read_root():
    return {"status": "ok", "service": "crm-api", "docs": "/docs"}


@app.get("/api/crm/health")
def health():
    return {"status": "ok", "service": "crm-api"}


@app.get("/api/crm/purchases")
def get_all_purchases(db: Session = Depends(get_db)):
    purchases = db.query(PurchaseHistory).order_by(PurchaseHistory.created_at.desc()).all()
    return [_serialize_purchase(purchase) for purchase in purchases]


@app.get("/api/crm/purchases/{customer_id}")
def get_purchases_by_customer(customer_id: str, db: Session = Depends(get_db)):
    purchases = (
        db.query(PurchaseHistory)
        .filter(PurchaseHistory.customer_id == customer_id)
        .order_by(PurchaseHistory.created_at.desc())
        .all()
    )
    if not purchases:
        raise HTTPException(status_code=404, detail="Riwayat pembelian tidak ditemukan untuk pelanggan ini")
    return [_serialize_purchase(purchase) for purchase in purchases]


@app.get("/api/crm/purchases/order/{order_id}", response_model=PurchaseHistoryResponse)
def get_purchase_by_order(order_id: str, db: Session = Depends(get_db)):
    purchase = db.query(PurchaseHistory).filter(PurchaseHistory.order_id == order_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Riwayat pembelian untuk order ini tidak ditemukan")
    return _serialize_purchase(purchase)


@app.post("/api/crm/internal/order-events/order-created", response_model=PurchaseMutationResponse)
def consume_order_created_event(payload: dict[str, Any], db: Session = Depends(get_db)):
    try:
        normalized = _normalize_order_event(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    purchase = db.query(PurchaseHistory).filter(PurchaseHistory.order_id == normalized["order_id"]).first()
    created = purchase is None

    if created:
        purchase = PurchaseHistory(
            order_id=normalized["order_id"],
            customer_name=normalized["customer_name"],
            total_price=normalized["total_price"],
        )
        db.add(purchase)

    purchase.customer_id = str(normalized["customer_id"]) if normalized["customer_id"] else None
    purchase.customer_name = normalized["customer_name"]
    purchase.customer_email = normalized["customer_email"]
    purchase.total_price = normalized["total_price"]
    purchase.status = normalized["status"]
    purchase.item_count = normalized["item_count"]
    purchase.raw_event = json.dumps(normalized["raw_event"], ensure_ascii=True)

    db.commit()
    db.refresh(purchase)

    return {
        "message": "Purchase history created from OrderCreated event." if created else "Existing purchase history refreshed from event.",
        "created": created,
        "purchase": _serialize_purchase(purchase),
    }
