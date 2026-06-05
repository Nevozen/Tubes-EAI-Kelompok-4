from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/inventory", response_model=List[schemas.Inventory])
def get_all_inventory(db: Session = Depends(get_db)):
    """Retrieve all products in the inventory."""
    return db.query(models.ProductInventory).all()

@app.post("/api/inventory", response_model=schemas.Inventory)
def create_inventory(item: schemas.InventoryCreate, db: Session = Depends(get_db)):
    """Create a new product."""
    db_item = models.ProductInventory(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/api/inventory/{product_id}", response_model=schemas.Inventory)
def get_inventory(product_id: int, db: Session = Depends(get_db)):
    """Retrieve specific product inventory."""
    inv = db.query(models.ProductInventory).filter(models.ProductInventory.id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Product not found in inventory")
    return inv

@app.put("/api/inventory/{product_id}", response_model=schemas.Inventory)
def update_inventory(product_id: int, item: schemas.InventoryUpdate, db: Session = Depends(get_db)):
    """Update a specific product."""
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
    """Delete a specific product."""
    inv = db.query(models.ProductInventory).filter(models.ProductInventory.id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(inv)
    db.commit()
    return {"message": "Product deleted successfully"}

@app.post("/api/inventory/reserve")
def reserve_stock(req: schemas.ReserveRequest, db: Session = Depends(get_db)):
    """
    Reserve stock for an order.
    Decreases available stock and increases reserved stock.
    """
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
    """
    Permanently deduct stock after an order is paid.
    Decreases the reserved stock.
    """
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
    """
    Add new stock to a product.
    """
    inv = db.query(models.ProductInventory).filter(models.ProductInventory.id == req.product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Product not found")
        
    inv.stock += req.quantity
    db.commit()
    db.refresh(inv)
    return {"message": "Stock replenished", "inventory": inv}

# Utility endpoint to seed dummy data for our 4 watches if DB is empty
@app.post("/api/inventory/seed")
def seed_database(db: Session = Depends(get_db)):
    existing = db.query(models.ProductInventory).count()
    if existing > 0:
        return {"message": "Database already seeded"}
        
    watches = [
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
            "reserved": 0
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
            "reserved": 0
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
            "reserved": 0
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
            "reserved": 0
        },
    ]
    
    for w in watches:
        item = models.ProductInventory(**w)
        db.add(item)
    
    db.commit()
    return {"message": "Database seeded successfully with dummy watches"}
