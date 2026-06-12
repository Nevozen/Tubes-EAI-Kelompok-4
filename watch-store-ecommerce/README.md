# WatchCommerce Integration System

WatchCommerce adalah proyek Enterprise Application Integration berbasis microservices untuk alur checkout e-commerce jam tangan. Sistem memisahkan domain `order`, `inventory`, `accounting`, dan `crm`, lalu menghubungkannya melalui API Gateway, RabbitMQ, integration router, adapter microservices, canonical event, transactional outbox, dan panel admin observability.

## Highlight Penilaian

- Minimal 4 sistem bisnis terpisah, masing-masing dengan database sendiri.
- Tidak ada akses langsung antar database. Seluruh side effect lintas domain melewati `RabbitMQ -> Router -> Adapter -> Internal API`.
- Minimal 6 EIP terlihat jelas di implementasi dan dokumentasi:
  `Message Channel`, `Message Router`, `Message Translator`, `Message Endpoint`, `Canonical Data Model`, `Aggregator`.
- Heterogenitas data ada pada alur `OrderCreated JSON -> Invoice XML`.
- Reliable messaging di `order-api` memakai `transactional outbox + retry backoff + idempotent downstream + manual retry`.
- Observability live tersedia di `GET /api/admin/observability` dan dashboard admin frontend.
- Stack dapat dijalankan dari nol dengan `docker compose up --build`.

## Arsitektur Singkat

- `order-api` menerima checkout, menyimpan order ke `order_db`, lalu menyimpan canonical event ke tabel `outbox_events` dalam transaksi yang sama.
- `order-outbox-publisher` membaca outbox order, mem-publish event ke RabbitMQ, lalu memperbarui status event menjadi `pending`, `published`, atau `failed`.
- `integration-router` menerima canonical `OrderCreated` dari queue utama dan merutekannya ke queue adapter downstream.
- `inventory-adapter`, `accounting-adapter`, dan `crm-adapter` mengubah message broker menjadi internal HTTP call ke service bisnis target.
- `inventory-api`, `accounting-api`, dan `crm-api` hanya mengakses database domain masing-masing.
- `api-gateway` menjadi entrypoint eksternal dan menyediakan endpoint agregasi bisnis serta observability.
- `frontend-web` menampilkan admin panel untuk overview bisnis dan observability.

Diagram lengkap ada di [docs/integration-architecture.md](/C:/Users/M%20S%20I/Downloads/Video/tubes%20eai%20new/Tubes-EAI-Kelompok-4/watch-store-ecommerce/docs/integration-architecture.md).

## Service dan Database

| Komponen | Peran | Database |
|---|---|---|
| `order-api` | Checkout, persistence order, canonical event outbox | `order_db` |
| `inventory-api` | Katalog produk, stok, reservation | `inventory_db` |
| `accounting-api` | Invoice dan transformasi JSON ke XML | `accounting_db` |
| `crm-api` | Purchase history pelanggan | `crm_db` |
| `api-gateway` | API-led integration dan observability | Tidak punya DB domain |
| `integration-router` | Routing canonical event | Tidak punya DB domain |
| `inventory-adapter` | Bridge RabbitMQ ke Inventory API | Tidak punya DB domain |
| `accounting-adapter` | Bridge RabbitMQ ke Accounting API | Tidak punya DB domain |
| `crm-adapter` | Bridge RabbitMQ ke CRM API | Tidak punya DB domain |
| `order-outbox-publisher` | Publisher worker untuk outbox order | Menggunakan `order_db` |
| `rabbitmq` | Message broker dan management API | Volume broker |

## Topologi Queue dan Event

| Tipe | Nama |
|---|---|
| Exchange | `watchcommerce.events` |
| Canonical event type | `OrderCreated` |
| Incoming routing key | `order.created` |
| Router queue | `integration.router.order.created` |
| Inventory adapter queue | `integration.inventory.order.created` |
| Accounting adapter queue | `integration.accounting.order.created` |
| CRM adapter queue | `integration.crm.order.created` |

## Environment Penting

Salin file environment terlebih dahulu:

```powershell
Copy-Item .env.example .env
Copy-Item frontend-web/.env.example frontend-web/.env
```

Variabel penting untuk penilaian:

- `DATABASE_URL` per service bisnis
- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`
- `RABBITMQ_EXCHANGE_TYPE`
- `RABBITMQ_ROUTING_KEY`
- `RABBITMQ_MESSAGE_TYPE`
- `OUTBOX_MAX_ATTEMPTS`
- `OUTBOX_POLL_INTERVAL_SECONDS`
- `RABBITMQ_MANAGEMENT_URL`
- `RABBITMQ_MANAGEMENT_USER`
- `RABBITMQ_MANAGEMENT_PASSWORD`
- `RABBITMQ_MANAGEMENT_CONSOLE_URL`
- `OBSERVED_RABBITMQ_QUEUES`
- `VITE_API_BASE_URL`
- `VITE_DEMO_ADMIN_EMAIL`
- `VITE_DEMO_ADMIN_PASSWORD`

Catatan kebersihan repo:

- `.env` root diabaikan oleh git.
- `frontend-web/.env` diabaikan oleh git.
- Artefak runtime seperti `__pycache__`, `.venv`, `node_modules`, `dist`, dan file `.db` lokal diabaikan oleh git.

## Menjalankan dari Nol

Dari root project `watch-store-ecommerce`:

```powershell
docker compose up --build -d
```

Verifikasi container:

```powershell
docker compose ps
```

Hentikan stack:

```powershell
docker compose down
```

Reset penuh volume data:

```powershell
docker compose down -v
```

## Endpoint Penting

External gateway:

- `GET /health`
- `POST /api/orders/checkout`
- `GET /api/orders`
- `GET /api/orders/outbox`
- `POST /api/orders/outbox/{event_id}/retry`
- `GET /api/inventory`
- `GET /api/inventory/order-reservations`
- `GET /api/accounting/invoices`
- `GET /api/crm/purchases`
- `GET /api/admin/integration-overview`
- `GET /api/admin/observability`

Internal integration endpoints:

- `POST /api/inventory/internal/order-events/order-created`
- `POST /api/v1/internal/order-events/order-created`
- `POST /api/crm/internal/order-events/order-created`

Frontend admin:

- `http://localhost:5173/admin`
- Demo admin email diambil dari `VITE_DEMO_ADMIN_EMAIL`
- Demo admin password diambil dari `VITE_DEMO_ADMIN_PASSWORD`

## Verifikasi Wajib

### 1. Health check semua service

```powershell
curl http://localhost:8080/health
```

Expected:

- `order`, `inventory`, `accounting`, `crm` semuanya `ok`

### 2. Checkout normal end-to-end

```powershell
curl -X POST http://localhost:8080/api/orders/checkout ^
  -H "Content-Type: application/json" ^
  -d "{\"customer_name\":\"Alya\",\"customer_email\":\"alya@example.com\",\"customer_phone\":\"081234567890\",\"shipping_address\":\"Jl. Asia Afrika No. 10, Bandung\",\"items\":[{\"product_id\":1,\"product_name\":\"White Decade\",\"quantity\":1,\"price\":12450000},{\"product_id\":3,\"product_name\":\"Cool Decade\",\"quantity\":1,\"price\":1100000}]}"
```

Lalu cek:

- `GET http://localhost:8080/api/orders/outbox`
- `GET http://localhost:8080/api/inventory/order-reservations`
- `GET http://localhost:8080/api/accounting/invoices`
- `GET http://localhost:8080/api/accounting/invoices/1/xml`
- `GET http://localhost:8080/api/crm/purchases`
- `GET http://localhost:8080/api/admin/observability`

Expected:

- order tersimpan di `order_db`
- outbox event menjadi `published`
- reservation inventory tercatat
- invoice XML tercatat
- purchase history CRM tercatat
- dashboard observability menunjukkan queue, outbox, dan downstream status sinkron

### 3. Skenario reliable messaging

Tujuan demo:

- broker mati sementara
- checkout tetap sukses
- event aman di outbox
- broker hidup kembali
- publisher retry otomatis
- downstream sinkron tanpa checkout ulang

Langkah:

```powershell
docker compose stop rabbitmq
```

Saat broker mati, lakukan checkout baru. Lalu cek:

- `GET http://localhost:8080/api/orders/outbox`

Expected sementara:

- order baru tetap tercatat
- event outbox berstatus `pending`
- `attempt_count` bertambah sesuai retry
- `last_error` berisi kegagalan koneksi broker

Hidupkan broker lagi:

```powershell
docker compose start rabbitmq
```

Expected setelah pulih:

- event outbox berubah menjadi `published`
- `published_at` terisi
- `GET /api/admin/observability` menampilkan downstream `synced`

Jika event pernah mencapai `failed`, gunakan retry manual:

```powershell
curl -X POST http://localhost:8080/api/orders/outbox/2/retry
```

## Dokumen Bukti

- Diagram arsitektur: [docs/integration-architecture.md](/C:/Users/M%20S%20I/Downloads/Video/tubes%20eai%20new/Tubes-EAI-Kelompok-4/watch-store-ecommerce/docs/integration-architecture.md)
- Kontrak API dan message: [docs/api-message-contracts.md](/C:/Users/M%20S%20I/Downloads/Video/tubes%20eai%20new/Tubes-EAI-Kelompok-4/watch-store-ecommerce/docs/api-message-contracts.md)
- Laporan 4-6 halaman: [docs/integration-report.md](/C:/Users/M%20S%20I/Downloads/Video/tubes%20eai%20new/Tubes-EAI-Kelompok-4/watch-store-ecommerce/docs/integration-report.md)
- Script demo video: [docs/demo-checklist.md](/C:/Users/M%20S%20I/Downloads/Video/tubes%20eai%20new/Tubes-EAI-Kelompok-4/watch-store-ecommerce/docs/demo-checklist.md)
- Self-assessment rubric: [docs/qualitycheck.md](/C:/Users/M%20S%20I/Downloads/Video/tubes%20eai%20new/Tubes-EAI-Kelompok-4/watch-store-ecommerce/docs/qualitycheck.md)

## Mapping ke Rubric

| Kriteria | Bukti |
|---|---|
| Sistem terpisah dan DB per service | `docker-compose.yml`, diagram arsitektur, tabel service pada README |
| Tidak ada cross-DB access | Arsitektur router/adapter, endpoint internal, dokumentasi laporan |
| Messaging broker | RabbitMQ service, queue topology, observability endpoint |
| API-led integration | `api-gateway`, route proxy, endpoint admin agregasi |
| Minimal 3 EIP | Diagram, laporan, dan kontrak message |
| Heterogenitas data | `accounting-api`, XML invoice, docs kontrak |
| Containerization | Dockerfile per komponen dan `docker compose up --build -d` |
| Konfigurasi via env | `.env.example`, `frontend-web/.env.example`, config service |
| Persistensi | named volume MySQL dan RabbitMQ |
| End-to-end demo | script demo dan endpoint observability |
| Bonus reliable messaging | transactional outbox, retry backoff, idempotent downstream, manual retry |
| Bonus observability | `GET /api/admin/observability`, RabbitMQ management stats, admin dashboard |

## Status Implementasi yang Sudah Terverifikasi

- `docker compose config` valid
- `docker compose up --build -d` sukses
- semua service sehat via gateway
- checkout normal menghasilkan outbox `published`
- saat RabbitMQ mati, checkout tetap sukses dan event tetap aman di outbox
- setelah RabbitMQ hidup lagi, publisher retry otomatis dan downstream sinkron
- manual retry untuk event `failed` juga bekerja
- panel admin analytics dan settings berhasil menampilkan data observability secara live
