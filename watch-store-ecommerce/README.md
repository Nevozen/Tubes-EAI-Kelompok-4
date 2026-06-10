# WatchCommerce Integration System

WatchCommerce adalah stack EAI berbasis microservices untuk demo alur checkout e-commerce jam tangan. Sistem ini memisahkan domain `order`, `inventory`, `accounting`, dan `crm`, lalu mengintegrasikannya dengan RabbitMQ, integration router, adapter microservices, dan API Gateway.

## Arsitektur Singkat
- `order-api` menyimpan order dan menerbitkan canonical event `OrderCreated`.
- `integration-router` menerima `order.created` dari RabbitMQ lalu merutekan event ke queue adapter downstream.
- `inventory-adapter`, `accounting-adapter`, dan `crm-adapter` mengonsumsi queue masing-masing lalu memanggil internal API service target lewat HTTP.
- `inventory-api`, `accounting-api`, dan `crm-api` hanya menulis ke database mereka sendiri.
- `api-gateway` menjadi single entrypoint eksternal dan menyediakan endpoint agregasi demo.

Diagram lengkap ada di `docs/integration-architecture.md`.

## Stack yang Dijalankan
- RabbitMQ Management
- API Gateway
- Order API + `order_db`
- Inventory API + `inventory_db`
- Accounting API + `accounting_db`
- CRM API + `crm_db`
- Integration Router
- Inventory Adapter
- Accounting Adapter
- CRM Adapter

## Environment
Salin `.env.example` menjadi `.env` jika ingin override nilai default:

```powershell
Copy-Item .env.example .env
```

Default penting:
- Gateway: `http://localhost:8080`
- Order API: `http://localhost:8001`
- Inventory API: `http://localhost:8002`
- Accounting API: `http://localhost:8003`
- CRM API: `http://localhost:8000`
- RabbitMQ UI: `http://localhost:15672`
- Frontend dev origin yang diizinkan gateway: `http://localhost:5173`

## Menjalankan dari Nol
Build dan jalankan semua komponen:

```powershell
docker compose up --build
```

Atau di background:

```powershell
docker compose up --build -d
```

Hentikan stack:

```powershell
docker compose down
```

Hentikan stack sekaligus hapus volume data:

```powershell
docker compose down -v
```

## Swagger / Docs
- Gateway: `http://localhost:8080/docs`
- Order API: `http://localhost:8001/docs`
- Inventory API: `http://localhost:8002/docs`
- Accounting API: `http://localhost:8003/docs`
- CRM API: `http://localhost:8000/docs`

## Endpoint Utama
- Gateway order proxy: `POST /api/orders/checkout`
- Gateway inventory proxy: `GET /api/inventory`
- Gateway accounting proxy: `GET /api/accounting/invoices`
- Gateway CRM proxy: `GET /api/crm/purchases`
- Gateway overview agregat: `GET /api/admin/integration-overview`

Internal integration endpoints:
- Inventory: `POST /api/inventory/internal/order-events/order-created`
- Accounting: `POST /api/v1/internal/order-events/order-created`
- CRM: `POST /api/crm/internal/order-events/order-created`

## Demo End-to-End
1. Jalankan stack:

```powershell
docker compose up --build -d
```

2. Inventory demo akan ter-seed otomatis saat `inventory-db` masih kosong. Kalau mau trigger manual lagi:

```powershell
curl -X POST http://localhost:8080/api/inventory/seed
```

3. Cek daftar produk:

```powershell
curl http://localhost:8080/api/inventory
```

4. Checkout lewat gateway:

```powershell
curl -X POST http://localhost:8080/api/orders/checkout ^
  -H "Content-Type: application/json" ^
  -d "{\"customer_name\":\"Alya\",\"customer_email\":\"alya@example.com\",\"customer_phone\":\"081234567890\",\"shipping_address\":\"Jl. Asia Afrika No. 10, Bandung\",\"items\":[{\"product_id\":1,\"product_name\":\"White Decade\",\"quantity\":1,\"price\":12450000},{\"product_id\":3,\"product_name\":\"Cool Decade\",\"quantity\":2,\"price\":1100000}]}"
```

5. Verifikasi hasil integrasi:
- `GET http://localhost:8080/api/admin/integration-overview`
- `GET http://localhost:8080/api/inventory/order-reservations`
- `GET http://localhost:8080/api/accounting/invoices`
- `GET http://localhost:8080/api/crm/purchases`

6. Lihat invoice XML:

```powershell
curl http://localhost:8080/api/accounting/invoices/1/xml
```

## Kontrak Pesan
Canonical event yang dipublish order service:

```json
{
  "event_type": "OrderCreated",
  "event_version": "1.0",
  "timestamp": "2026-06-10T14:10:00+00:00",
  "source": "order-api",
  "data": {
    "order_id": "1",
    "customer_id": "alya@example.com",
    "customer_name": "Alya",
    "customer_email": "alya@example.com",
    "customer_phone": "081234567890",
    "shipping_address": "Jl. Asia Afrika No. 10, Bandung",
    "currency": "IDR",
    "subtotal": 14650000,
    "tax_amount": 0,
    "shipping_amount": 0,
    "grand_total": 14650000,
    "total_amount": 14650000,
    "status": "CONFIRMED",
    "created_at": "2026-06-10T14:10:00+00:00",
    "items": [
      {
        "product_id": 1,
        "product_name": "White Decade",
        "sku": null,
        "quantity": 1,
        "unit_price": 12450000,
        "price": 12450000,
        "line_total": 12450000,
        "subtotal": 12450000
      }
    ]
  }
}
```

Detail skema payload dan contoh XML ada di `docs/api-message-contracts.md`.

## Bukti Checklist
- Diagram integrasi: `docs/integration-architecture.md`
- Kontrak API dan message: `docs/api-message-contracts.md`
- Laporan EIP dan arsitektur: `docs/integration-report.md`
- Script video demo: `docs/demo-checklist.md`
