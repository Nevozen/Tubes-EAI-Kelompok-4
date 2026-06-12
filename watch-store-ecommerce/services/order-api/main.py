import logging
import json
from datetime import datetime, timezone
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
import schemas
from database import engine, get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Order API",
    description=(
        "Handles checkout and order persistence for WatchCommerce. "
        "Publishes canonical OrderCreated events for downstream integration."
    ),
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_order_created_event(order: models.Order) -> dict:
    ordered_at = order.created_at or datetime.now(timezone.utc)
    subtotal = 0
    items = []

    for item in order.items:
        line_total = item.subtotal or (item.price * item.quantity)
        subtotal += line_total
        items.append(
            {
                "product_id": item.product_id,
                "product_name": item.product_name,
                "sku": None,
                "quantity": item.quantity,
                "unit_price": item.price,
                "price": item.price,
                "line_total": line_total,
                "subtotal": line_total,
            }
        )

    return {
        "event_type": "OrderCreated",
        "event_version": "1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "order-api",
        "data": {
            "order_id": str(order.id),
            "customer_id": order.customer_email,
            "customer_name": order.customer_name,
            "customer_email": order.customer_email,
            "customer_phone": order.customer_phone,
            "shipping_address": order.shipping_address,
            "currency": "IDR",
            "subtotal": subtotal,
            "tax_amount": 0,
            "shipping_amount": 0,
            "grand_total": order.total_amount,
            "total_amount": order.total_amount,
            "status": order.status.upper(),
            "created_at": ordered_at.isoformat(),
            "items": items,
        },
    }


def serialize_outbox_event(event: models.OutboxEvent) -> dict:
    return {
        "event_id": event.id,
        "aggregate_type": event.aggregate_type,
        "aggregate_id": event.aggregate_id,
        "event_type": event.event_type,
        "payload": json.loads(event.payload),
        "status": event.status,
        "attempt_count": event.attempt_count,
        "last_error": event.last_error,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
        "published_at": event.published_at,
    }


def build_outbox_summary(db: Session) -> dict:
    raw_counts = dict(
        db.query(models.OutboxEvent.status, func.count(models.OutboxEvent.id))
        .group_by(models.OutboxEvent.status)
        .all()
    )
    total = int(sum(raw_counts.values()))
    return {
        "total": total,
        "pending": int(raw_counts.get("pending", 0)),
        "published": int(raw_counts.get("published", 0)),
        "failed": int(raw_counts.get("failed", 0)),
    }


@app.get("/")
def root():
    return {"service": "order-api", "version": app.version, "docs": "/docs"}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    return {"status": "ok", "service": "order-api", "outbox": build_outbox_summary(db)}


@app.get("/api/orders", response_model=List[schemas.OrderResponse])
def get_all_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).all()


@app.post("/api/orders/checkout", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(request: schemas.CheckoutRequest, db: Session = Depends(get_db)):
    if not request.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    order_items = []
    total_amount = 0
    for item in request.items:
        subtotal = item.price * item.quantity
        total_amount += subtotal
        order_items.append(
            models.OrderItem(
                product_id=item.product_id,
                product_name=item.product_name,
                quantity=item.quantity,
                price=item.price,
                subtotal=subtotal,
            )
        )

    new_order = models.Order(
        customer_name=request.customer_name,
        customer_email=request.customer_email,
        customer_phone=request.customer_phone,
        shipping_address=request.shipping_address,
        total_amount=total_amount,
        status="confirmed",
        items=order_items,
    )

    db.add(new_order)
    db.flush()

    order_created_event = build_order_created_event(new_order)
    db.add(
        models.OutboxEvent(
            aggregate_type="order",
            aggregate_id=str(new_order.id),
            event_type=order_created_event["event_type"],
            payload=json.dumps(order_created_event, ensure_ascii=True),
            status="pending",
        )
    )
    db.commit()
    db.refresh(new_order)

    logger.info("Order %s stored with canonical OrderCreated outbox event.", new_order.id)

    return new_order


@app.get("/api/orders/outbox", response_model=schemas.OutboxListResponse)
def get_outbox_events(limit: int = 20, db: Session = Depends(get_db)):
    safe_limit = max(1, min(limit, 100))
    events = (
        db.query(models.OutboxEvent)
        .order_by(models.OutboxEvent.created_at.desc(), models.OutboxEvent.id.desc())
        .limit(safe_limit)
        .all()
    )
    return {
        "summary": build_outbox_summary(db),
        "items": [serialize_outbox_event(event) for event in events],
    }


@app.post("/api/orders/outbox/{event_id}/retry", response_model=schemas.OutboxRetryResponse)
def retry_outbox_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.OutboxEvent).filter(models.OutboxEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Outbox event not found")

    if event.status == "published":
        raise HTTPException(status_code=400, detail="Published outbox events cannot be retried")

    event.status = "pending"
    event.attempt_count = 0
    event.last_error = None
    event.published_at = None
    db.commit()
    db.refresh(event)

    return {
        "message": f"Outbox event #{event_id} re-queued for publishing.",
        "event": serialize_outbox_event(event),
    }


@app.get("/api/orders/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.put("/api/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(order_id: int, request: schemas.StatusUpdateRequest, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_statuses = ["pending", "confirmed", "cancelled"]
    if request.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )

    order.status = request.status
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return order


@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(order)
    db.commit()
    return {"message": f"Order #{order_id} deleted successfully"}
