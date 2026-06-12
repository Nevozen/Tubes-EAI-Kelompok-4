# WatchCommerce Accounting API

Accounting API adalah domain service untuk invoice pada proyek WatchCommerce. Service ini hanya mengakses `accounting_db`, menerima canonical `OrderCreated` melalui internal endpoint yang dipanggil adapter, lalu mentransformasikan payload JSON menjadi XML invoice.

## Peran Dalam Arsitektur

- menyimpan invoice dan invoice item ke `accounting_db`
- menyediakan internal endpoint idempotent untuk event `OrderCreated`
- mentransformasikan canonical event JSON menjadi dokumen XML invoice
- tidak menjadi consumer RabbitMQ langsung
- menerima delivery event dari `accounting-adapter`

## Fitur

- REST API untuk health check dan daftar invoice
- internal endpoint untuk preview transformasi dan create/update invoice dari `OrderCreated`
- transformasi JSON ke XML
- idempotent per `order_id`
- konfigurasi RabbitMQ dan endpoint sepenuhnya via environment variable

## Struktur

```text
accounting-api/
|-- app/
|   |-- config.py
|   |-- database.py
|   |-- main.py
|   |-- models.py
|   |-- schemas.py
|   `-- services/
|       |-- invoice_service.py
|       `-- xml_transformer.py
|-- requirements.txt
`-- Dockerfile
```

## Menjalankan Lokal

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8003
```

## Environment Wajib

- `DATABASE_URL`
- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`
- `RABBITMQ_EXCHANGE_TYPE`
- `RABBITMQ_QUEUE`
- `RABBITMQ_ROUTING_KEYS`

Catatan:

- pada runtime proyek utama, seluruh env diisi dari `docker-compose.yml`
- tidak ada fallback SQLite dalam implementasi akhir

## Endpoint Utama

- `GET /api/v1/health`
- `POST /api/v1/internal/order-events/order-created/preview`
- `POST /api/v1/internal/order-events/order-created`
- `GET /api/v1/invoices`
- `GET /api/v1/invoices/by-order/{order_id}`
- `GET /api/v1/invoices/{invoice_id}`
- `GET /api/v1/invoices/{invoice_id}/xml`

## Contoh Event Masuk

```json
{
  "event_type": "OrderCreated",
  "event_version": "1.0",
  "source": "order-api",
  "data": {
    "order_id": "6",
    "customer_name": "Auto Retry",
    "customer_email": "auto.retry@example.com",
    "currency": "IDR",
    "grand_total": 1100000,
    "status": "CONFIRMED",
    "items": [
      {
        "product_name": "Cool Decade",
        "quantity": 1,
        "unit_price": 1100000,
        "line_total": 1100000
      }
    ]
  }
}
```

## Contoh Hasil XML

```xml
<?xml version="1.0" ?>
<invoice>
  <invoice_number>INV-20260612075650-6</invoice_number>
  <event_name>OrderCreated</event_name>
  <order_id>6</order_id>
  <customer>
    <customer_name>Auto Retry</customer_name>
    <customer_email>auto.retry@example.com</customer_email>
  </customer>
  <amounts>
    <currency>IDR</currency>
    <grand_total>1100000.00</grand_total>
    <status>CONFIRMED</status>
  </amounts>
</invoice>
```

## Idempotency

Accounting API menggunakan `order_id` sebagai kunci idempotensi.

- jika event baru diterima, invoice akan dibuat
- jika event yang sama diterima ulang, invoice akan di-refresh tanpa menggandakan record

Desain ini penting untuk mendukung retry outbox dan replay message yang aman.
