from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import logging

import models
import schemas
from database import engine, get_db
from rabbitmq import publish_order_created

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Create database tables ───────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

# ── FastAPI App ──────────────────────────────────────────────────
app = FastAPI(
    title="Order API",
    description="Handles checkout process and order management for WatchCommerce. "
                "Publishes OrderCreated events to RabbitMQ for integration with "
                "Inventory, Accounting, and CRM services.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════════════════════


@app.get("/api/orders", response_model=List[schemas.OrderResponse])
def get_all_orders(db: Session = Depends(get_db)):
    """Retrieve all orders with their items."""
    orders = db.query(models.Order).all()
    return orders


@app.get("/api/orders/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific order by ID."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.post("/api/orders/checkout", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(request: schemas.CheckoutRequest, db: Session = Depends(get_db)):
    """
    Process a customer checkout.

    Flow:
      1. Validate the checkout payload
      2. Calculate total_amount from all items
      3. Save Order + OrderItems to order_db
      4. Publish 'OrderCreated' event to RabbitMQ
      5. Return the created order

    This is the main integration point — the published event triggers:
      - Inventory API → stock deduction
      - Accounting API → invoice creation (JSON→XML)
      - CRM API → purchase history recording
    """
    if not request.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    # ── Step 1: Build order items and calculate total ────────────
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

    # ── Step 2: Create the order record ──────────────────────────
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
    db.commit()
    db.refresh(new_order)

    logger.info(f"Order #{new_order.id} created — total: Rp {total_amount:,}")

    # ── Step 3: Publish OrderCreated event to RabbitMQ ───────────
    event_payload = {
        "event_type": "OrderCreated",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {
            "order_id": new_order.id,
            "customer_name": new_order.customer_name,
            "customer_email": new_order.customer_email,
            "customer_phone": new_order.customer_phone,
            "shipping_address": new_order.shipping_address,
            "total_amount": new_order.total_amount,
            "status": new_order.status,
            "items": [
                {
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "price": item.price,
                    "subtotal": item.subtotal,
                }
                for item in new_order.items
            ],
        },
    }

    try:
        publish_order_created(event_payload)
        logger.info(f"OrderCreated event published for order #{new_order.id}")
    except Exception as e:
        # Log the error but don't roll back the order — eventual consistency
        logger.warning(f"Failed to publish event for order #{new_order.id}: {e}")

    return new_order


@app.put("/api/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(order_id: int, request: schemas.StatusUpdateRequest, db: Session = Depends(get_db)):
    """Update the status of an existing order."""
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

    logger.info(f"Order #{order_id} status updated to '{request.status}'")
    return order


@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Delete an order and its items."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(order)
    db.commit()
    return {"message": f"Order #{order_id} deleted successfully"}


# ── Seed endpoint for demo / testing ─────────────────────────────
@app.post("/api/orders/seed")
def seed_orders(db: Session = Depends(get_db)):
    """
    Seed the database with sample orders for demo purposes.
    Uses products from the Inventory API seed data.
    """
    existing = db.query(models.Order).count()
    if existing > 0:
        return {"message": "Database already seeded"}

    sample_orders = [
        {
            "customer_name": "Budi Santoso",
            "customer_email": "budi@example.com",
            "customer_phone": "081234567890",
            "shipping_address": "Jl. Asia Afrika No. 65, Bandung",
            "total_amount": 13550000,
            "status": "confirmed",
            "items": [
                {"product_id": 1, "product_name": "White Decade", "quantity": 1, "price": 12450000, "subtotal": 12450000},
                {"product_id": 3, "product_name": "Cool Decade", "quantity": 1, "price": 1100000, "subtotal": 1100000},
            ],
        },
        {
            "customer_name": "Siti Nurhaliza",
            "customer_email": "siti@example.com",
            "customer_phone": "087654321098",
            "shipping_address": "Jl. Braga No. 12, Bandung",
            "total_amount": 1450000,
            "status": "confirmed",
            "items": [
                {"product_id": 2, "product_name": "Couple Decade", "quantity": 1, "price": 1450000, "subtotal": 1450000},
            ],
        },
    ]

    for order_data in sample_orders:
        items_data = order_data.pop("items")
        order = models.Order(**order_data)

        for item_data in items_data:
            order.items.append(models.OrderItem(**item_data))

        db.add(order)

    db.commit()
    return {"message": "Database seeded successfully with sample orders"}
