from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from .database import Base


class PurchaseHistory(Base):
    """Model database untuk menyimpan riwayat transaksi pembelian pelanggan."""
    __tablename__ = "purchase_histories"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, nullable=False, index=True)  # ID pesanan dari Order API
    customer_id = Column(String(100), nullable=True, index=True)  # ID pelanggan (dapat berupa string/email/angka)
    customer_name = Column(String(100), nullable=False)  # Nama pelanggan
    total_price = Column(Float, nullable=False)  # Total nilai transaksi belanja
    created_at = Column(DateTime, default=datetime.utcnow)  # Tanggal & waktu transaksi dibuat
