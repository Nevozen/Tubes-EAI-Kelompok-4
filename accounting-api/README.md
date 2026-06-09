# WatchCommerce Accounting API

Accounting API untuk proyek **WatchCommerce Integration System**. Service ini berdiri sendiri dengan database milik `accounting_db`, menerima event `OrderCreated` dari RabbitMQ, lalu menyimpan invoice hasil transformasi JSON ke XML.

## Fitur

- REST API untuk health check dan melihat daftar invoice.
- Internal endpoint untuk menerima payload `OrderCreated` langsung tanpa broker.
- RabbitMQ consumer untuk menerima event asynchronous dari service lain.
- Transformasi data order JSON menjadi XML invoice.
- Database terpisah untuk invoice dan detail item invoice.
- Idempotent per `order_id`, jadi event ganda tidak membuat invoice dobel.

## Struktur

```text
accounting-api/
|-- app/
|   |-- config.py
|   |-- database.py
|   |-- main.py
|   |-- models.py
|   |-- schemas.py
|   |-- messaging/consumer.py
|   `-- services/
|       |-- invoice_service.py
|       `-- xml_transformer.py
|-- consumer.py
|-- requirements.txt
`-- .env.example
```

## Instalasi

```bash
cd accounting-api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Salin konfigurasi environment:

```bash
copy .env.example .env
```

## Menjalankan REST API

```bash
uvicorn app.main:app --reload
```

Dokumentasi Swagger:

- `http://127.0.0.1:8000/docs`

## Menjalankan RabbitMQ Consumer

Jalankan di terminal terpisah:

```bash
python consumer.py
```

## Endpoint utama

- `GET /api/v1/health`
- `POST /api/v1/internal/order-events/order-created/preview`
- `POST /api/v1/internal/order-events/order-created`
- `GET /api/v1/invoices`
- `GET /api/v1/invoices/by-order/{order_id}`
- `GET /api/v1/invoices/{invoice_id}`
- `GET /api/v1/invoices/{invoice_id}/xml`

## Contoh payload event

```json
{
  "event_type": "OrderCreated",
  "occurred_at": "2026-06-09T19:45:00",
  "data": {
    "order_id": "ORD-1001",
    "customer_id": "CUS-001",
    "customer_name": "Budi Santoso",
    "customer_email": "budi@example.com",
    "currency": "IDR",
    "subtotal": 3500000,
    "tax_amount": 350000,
    "shipping_amount": 50000,
    "grand_total": 3900000,
    "payment_status": "unpaid",
    "items": [
      {
        "sku": "WATCH-001",
        "product_name": "Chronograph Silver",
        "quantity": 1,
        "unit_price": 3500000
      }
    ]
  }
}
```

## Contoh publish event ke RabbitMQ

Routing key yang didengarkan:

- `order.created`
- `OrderCreated`

Contoh publisher dari service lain cukup mengirim payload JSON seperti di atas ke exchange `watchcommerce.events`.

## Catatan implementasi

- Default database menggunakan SQLite supaya mudah demo.
- Untuk presentasi akhir, ganti ke PostgreSQL atau MySQL dengan mengatur `.env`.
- Service ini tidak mengakses database service lain secara langsung.
- Semua mapping invoice dilakukan di dalam `Accounting API`.
