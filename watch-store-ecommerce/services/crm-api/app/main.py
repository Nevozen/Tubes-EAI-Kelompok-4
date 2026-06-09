from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import get_db, engine, Base
from .models import PurchaseHistory

# Buat tabel database secara otomatis jika belum ada
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CRM API",
    description="Service untuk mencatat dan mengelola riwayat pembelian pelanggan.",
    version="1.0.0"
)

# Aktifkan CORS agar web frontend bisa mengakses endpoint ini langsung
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Endpoint root untuk mengecek apakah service CRM aktif."""
    return {"status": "ok", "message": "Service CRM API berjalan lancar"}


@app.get("/api/crm/purchases")
def get_all_purchases(db: Session = Depends(get_db)):
    """Mengambil seluruh data riwayat pembelian dari database."""
    purchases = db.query(PurchaseHistory).all()
    return purchases


@app.get("/api/crm/purchases/{customer_id}")
def get_purchases_by_customer(customer_id: str, db: Session = Depends(get_db)):
    """Mengambil riwayat pembelian khusus untuk satu pelanggan berdasarkan customer_id."""
    purchases = db.query(PurchaseHistory).filter(PurchaseHistory.customer_id == customer_id).all()
    if not purchases:
        raise HTTPException(
            status_code=404, 
            detail="Riwayat pembelian tidak ditemukan untuk pelanggan ini"
        )
    return purchases
