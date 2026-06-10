import json
import os
from typing import Any, List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import SessionLocal, engine, get_db

AUTO_SEED_INVENTORY = os.getenv("AUTO_SEED_INVENTORY", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory API",
    description="Owns product inventory and idempotent stock reservations for OrderCreated events.",
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

    items = []
    for raw_item in raw_items:
        if not isinstance(raw_item, dict):
            continue
        product_id = _coalesce(raw_item.get("product_id"), raw_item.get("id"))
        quantity = int(_coalesce(raw_item.get("quantity"), raw_item.get("qty"), 0) or 0)
        if product_id in (None, "") or quantity <= 0:
            continue

        unit_price = int(_coalesce(raw_item.get("unit_price"), raw_item.get("price"), 0) or 0)
        line_total = int(_coalesce(raw_item.get("line_total"), raw_item.get("subtotal"), unit_price * quantity) or 0)
        items.append(
            {
                "product_id": int(product_id),
                "product_name": str(_coalesce(raw_item.get("product_name"), raw_item.get("name"), product_id)),
                "quantity": quantity,
                "unit_price": unit_price,
                "line_total": line_total,
            }
        )

    if not items:
        raise ValueError("Payload order tidak memiliki items yang valid.")

    return {
        "event_name": str(_coalesce(payload.get("event_type"), payload.get("event"), "OrderCreated")),
        "order_id": order_id,
        "customer_email": _coalesce(
            order_payload.get("customer_email"),
            order_payload.get("customerEmail"),
            order_payload.get("customer_id"),
        ),
        "status": str(_coalesce(order_payload.get("status"), "RESERVED")).upper(),
        "items": items,
        "raw_payload": payload,
    }


def _serialize_reservation(reservation: models.InventoryReservation) -> dict[str, Any]:
    return {
        "id": reservation.id,
        "order_id": reservation.order_id,
        "event_name": reservation.event_name,
        "status": reservation.status,
        "customer_email": reservation.customer_email,
        "total_items": reservation.total_items,
        "created_at": reservation.created_at,
        "updated_at": reservation.updated_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": item.line_total,
            }
            for item in reservation.items
        ],
    }


DEMO_WATCHES = [
    {
        "id": 1,
        "product_name": "White Decade",
        "sku": "DC-G-001",
        "category": "Gentle",
        "series": "Modern",
        "price": 12450000,
        "description": "A definitive statement in industrial minimalism. The White Decade features a monolithic surgical-grade steel casing paired with a stark, void-white dial.",
        "image": "/assets/images/hero_watch.png",
        "stock": 50,
        "reserved": 0,
    },
    {
        "id": 2,
        "product_name": "Couple Decade",
        "sku": "DC-C-012",
        "category": "Couple",
        "series": "Gift",
        "price": 1450000,
        "description": "Designed to be shared. The Couple Decade represents timeless connection with a matching pair of exquisite timepieces.",
        "image": "/assets/images/couple_watch.png",
        "stock": 30,
        "reserved": 0,
    },
    {
        "id": 3,
        "product_name": "Cool Decade",
        "sku": "DC-M-045",
        "category": "Modern",
        "series": "Sport",
        "price": 1100000,
        "description": "For the active and the bold. A dark, moody aesthetic combined with red contrast stitching on a premium leather band.",
        "image": "/assets/images/cool_watch.png",
        "stock": 100,
        "reserved": 0,
    },
    {
        "id": 4,
        "product_name": "Minimalist Decade",
        "sku": "DC-G-002",
        "category": "Gentle",
        "series": "Classic",
        "price": 850000,
        "description": "Simplicity is the ultimate sophistication. A clean white dial, ultra-thin profile, and a timeless black leather strap.",
        "image": "/assets/images/minimalist_watch.png",
        "stock": 25,
        "reserved": 0,
    },
]


def _seed_database_if_empty(db: Session) -> bool:
    if db.query(models.ProductInventory).count() > 0:
        return False

    for watch in DEMO_WATCHES:
        db.add(models.ProductInventory(**watch))

    db.commit()
    return True


@app.on_event("startup")
def auto_seed_demo_inventory():
    if not AUTO_SEED_INVENTORY:
        return

    db = SessionLocal()
    try:
        _seed_database_if_empty(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"service": "inventory-api", "version": app.version, "docs": "/docs"}


@app.get("/api/inventory/health")
def health():
    return {"status": "ok", "service": "inventory-api"}


@app.get("/api/inventory", response_model=List[schemas.Inventory])
def get_all_inventory(db: Session = Depends(get_db)):
    return db.query(models.ProductInventory).all()


@app.post("/api/inventory", response_model=schemas.Inventory)
def create_inventory(item: schemas.InventoryCreate, db: Session = Depends(get_db)):
    db_item = models.ProductInventory(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.post("/api/inventory/reserve")
def reserve_stock(req: schemas.ReserveRequest, db: Session = Depends(get_db)):
    inv = db.query(models.ProductInventory).filter(models.ProductInventory.id == req.product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Product not found")
    if inv.stock < req.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock available")

    inv.stock -= req.quantity
    inv.reserved += req.quantity
    db.commit()
    db.refresh(inv)
    return {"message": "Stock reserved successfully", "inventory": inv}


@app.post("/api/inventory/deduct")
def deduct_stock(req: schemas.DeductRequest, db: Session = Depends(get_db)):
    inv = db.query(models.ProductInventory).filter(models.ProductInventory.id == req.product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Product not found")
    if inv.reserved < req.quantity:
        raise HTTPException(status_code=400, detail="Not enough reserved stock to deduct")

    inv.reserved -= req.quantity
    db.commit()
    db.refresh(inv)
    return {"message": "Stock deducted permanently", "inventory": inv}


@app.post("/api/inventory/restock")
def restock(req: schemas.RestockRequest, db: Session = Depends(get_db)):
    inv = db.query(models.ProductInventory).filter(models.ProductInventory.id == req.product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Product not found")

    inv.stock += req.quantity
    db.commit()
    db.refresh(inv)
    return {"message": "Stock replenished", "inventory": inv}


@app.get("/api/inventory/order-reservations", response_model=List[schemas.InventoryReservationResponse])
def get_reservations(db: Session = Depends(get_db)):
    reservations = (
        db.query(models.InventoryReservation)
        .order_by(models.InventoryReservation.created_at.desc())
        .all()
    )
    return [_serialize_reservation(reservation) for reservation in reservations]


@app.get("/api/inventory/order-reservations/{order_id}", response_model=schemas.InventoryReservationResponse)
def get_reservation_by_order(order_id: str, db: Session = Depends(get_db)):
    reservation = (
        db.query(models.InventoryReservation)
        .filter(models.InventoryReservation.order_id == order_id)
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return _serialize_reservation(reservation)


@app.post(
    "/api/inventory/internal/order-events/order-created",
    response_model=schemas.InventoryReservationMutationResponse,
)
def reserve_from_order_event(payload: dict[str, Any], db: Session = Depends(get_db)):
    try:
        normalized = _normalize_order_event(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    existing = (
        db.query(models.InventoryReservation)
        .filter(models.InventoryReservation.order_id == normalized["order_id"])
        .first()
    )
    if existing:
        return {
            "message": "Existing reservation reused for this order.",
            "created": False,
            "reservation": _serialize_reservation(existing),
        }

    product_ids = [item["product_id"] for item in normalized["items"]]
    products = (
        db.query(models.ProductInventory)
        .filter(models.ProductInventory.id.in_(product_ids))
        .all()
    )
    product_map = {product.id: product for product in products}

    missing_ids = [str(product_id) for product_id in product_ids if product_id not in product_map]
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Products not found: {', '.join(missing_ids)}")

    for item in normalized["items"]:
        product = product_map[item["product_id"]]
        if product.stock < item["quantity"]:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product {product.id} ({product.product_name})",
            )

    reservation = models.InventoryReservation(
        order_id=normalized["order_id"],
        event_name=normalized["event_name"],
        status="RESERVED",
        customer_email=normalized["customer_email"],
        total_items=sum(item["quantity"] for item in normalized["items"]),
        raw_event=json.dumps(normalized["raw_payload"], ensure_ascii=True),
    )
    db.add(reservation)

    for item in normalized["items"]:
        product = product_map[item["product_id"]]
        product.stock -= item["quantity"]
        product.reserved += item["quantity"]
        reservation.items.append(
            models.InventoryReservationItem(
                product_id=item["product_id"],
                product_name=item["product_name"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                line_total=item["line_total"],
            )
        )

    db.commit()
    db.refresh(reservation)

    return {
        "message": "Inventory reserved from OrderCreated event.",
        "created": True,
        "reservation": _serialize_reservation(reservation),
    }


@app.post("/api/inventory/seed")
def seed_database(db: Session = Depends(get_db)):
    created = _seed_database_if_empty(db)
    if not created:
        return {"message": "Database already seeded", "created": False}
    return {"message": "Database seeded successfully with dummy watches", "created": True}


@app.get("/api/inventory/{product_id}", response_model=schemas.Inventory)
def get_inventory(product_id: int, db: Session = Depends(get_db)):
    inv = db.query(models.ProductInventory).filter(models.ProductInventory.id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Product not found in inventory")
    return inv


@app.put("/api/inventory/{product_id}", response_model=schemas.Inventory)
def update_inventory(product_id: int, item: schemas.InventoryUpdate, db: Session = Depends(get_db)):
    inv = db.query(models.ProductInventory).filter(models.ProductInventory.id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(inv, key, value)

    db.commit()
    db.refresh(inv)
    return inv


@app.delete("/api/inventory/{product_id}")
def delete_inventory(product_id: int, db: Session = Depends(get_db)):
    inv = db.query(models.ProductInventory).filter(models.ProductInventory.id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(inv)
    db.commit()
    return {"message": "Product deleted successfully"}
