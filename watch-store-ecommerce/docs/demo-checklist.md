# Demo Script 5-10 Menit

Dokumen ini dipakai sebagai naskah demo, bukan sekadar checklist teknis. Gunakan urutan berikut agar alur presentasi terlihat rapi, cepat, dan langsung menunjukkan nilai proyek.

## Persiapan Sebelum Rekam / Presentasi

1. Jalankan stack:

```powershell
docker compose up --build -d
```

2. Siapkan tab berikut:

- `http://localhost:8080/docs`
- `http://localhost:15672`
- `http://localhost:5173/admin/analytics`
- terminal untuk `curl`

3. Login admin frontend dengan credential dari `frontend-web/.env`.

## Narasi Pembuka

Ucapan yang disarankan:

> Proyek kami adalah sistem integrasi enterprise untuk alur checkout e-commerce. Kami memisahkan domain order, inventory, accounting, dan CRM ke service dan database yang berbeda. Integrasi antar domain dilakukan melalui RabbitMQ, integration router, adapter microservices, dan API Gateway. Selain alur normal, kami juga menambahkan reliable messaging dan observability agar sistem tetap aman saat broker bermasalah.

## Scene 1 - Tunjukkan Arsitektur dan Boundary

Layar:

- buka diagram arsitektur di repository

Narasi:

> Di sini terlihat setiap domain memiliki database masing-masing. Order service tidak mengakses database inventory, accounting, atau CRM. Semua side effect lintas domain melewati RabbitMQ, router, dan adapter. Ini penting untuk menunjukkan loose coupling dan pemisahan integration layer.

Expected outcome:

- dosen melihat ada minimal 4 sistem terpisah
- dosen melihat label EIP pada arsitektur

## Scene 2 - Tunjukkan Semua Service Hidup

Layar:

- terminal

Command:

```powershell
docker compose ps
curl http://localhost:8080/health
```

Narasi:

> Stack dapat dijalankan dari satu perintah Docker Compose. Health check gateway juga menunjukkan seluruh service inti aktif.

Expected outcome:

- semua container `Up`
- `order`, `inventory`, `accounting`, `crm` berstatus `ok`

## Scene 3 - Tunjukkan Queue Topology

Layar:

- RabbitMQ Management UI

Narasi:

> Ini adalah queue topology yang dipakai. Order service hanya publish satu canonical event ke exchange, lalu integration router mendistribusikannya ke tiga queue adapter downstream.

Queue yang ditunjukkan:

- `integration.router.order.created`
- `integration.inventory.order.created`
- `integration.accounting.order.created`
- `integration.crm.order.created`

Expected outcome:

- terlihat consumer count pada tiap queue
- terlihat semua queue berasal dari satu event canonical

## Scene 4 - Demo Checkout Normal End-to-End

Layar:

- terminal

Command:

```powershell
curl -X POST http://localhost:8080/api/orders/checkout ^
  -H "Content-Type: application/json" ^
  -d "{\"customer_name\":\"Demo UAS\",\"customer_email\":\"demo.uas@example.com\",\"customer_phone\":\"081234567899\",\"shipping_address\":\"Jl. Merdeka No. 1, Jakarta\",\"items\":[{\"product_id\":1,\"product_name\":\"White Decade\",\"quantity\":1,\"price\":12450000},{\"product_id\":4,\"product_name\":\"Minimalist Decade\",\"quantity\":1,\"price\":850000}]}"
```

Narasi:

> Checkout masuk melalui gateway ke order service. Order service menyimpan order dan canonical event ke outbox secara transaksional. Publisher worker lalu mengirim event ke broker, dan downstream domain akan sinkron otomatis.

Expected outcome:

- response checkout sukses
- order baru memiliki `status` confirmed

## Scene 5 - Verifikasi Hasil Integrasi

Layar:

- admin analytics page
- atau terminal dengan endpoint verifikasi

Command opsional:

```powershell
curl http://localhost:8080/api/orders/outbox
curl http://localhost:8080/api/inventory/order-reservations
curl http://localhost:8080/api/accounting/invoices
curl http://localhost:8080/api/crm/purchases
curl http://localhost:8080/api/admin/observability
```

Narasi:

> Di sini kita bisa lihat order baru langsung menghasilkan outbox event dengan status published. Inventory membuat reservation, accounting membuat invoice XML, dan CRM mencatat purchase history. Dashboard observability juga menunjukkan queue sehat dan sinkronisasi downstream berhasil.

Expected outcome:

- outbox `published`
- inventory reservation ada
- invoice ada
- purchase history ada
- downstream status `synced`

## Scene 6 - Tunjukkan Heterogenitas Data

Layar:

- terminal atau Swagger accounting

Command:

```powershell
curl http://localhost:8080/api/accounting/invoices/1/xml
```

Narasi:

> Salah satu requirement proyek adalah heterogenitas data. Di sini canonical event yang bentuknya JSON ditransformasikan menjadi XML invoice pada accounting service.

Expected outcome:

- XML invoice tampil jelas

## Scene 7 - Demo Reliable Messaging

Layar:

- terminal dan admin analytics

Langkah:

```powershell
docker compose stop rabbitmq
```

Lalu lakukan checkout baru dengan payload sederhana.

Narasi:

> Sekarang RabbitMQ kami matikan sementara. Checkout tetap boleh sukses, karena order dan outbox event disimpan dalam satu transaksi database. Jadi event tidak hilang walaupun broker sedang down.

Lalu cek:

```powershell
curl http://localhost:8080/api/orders/outbox
```

Narasi lanjutan:

> Event baru terlihat dalam status pending dengan attempt count dan last error. Ini menunjukkan event tertahan aman di outbox, bukan hilang.

Nyalakan broker kembali:

```powershell
docker compose start rabbitmq
```

Narasi:

> Setelah broker hidup lagi, publisher worker retry otomatis dengan backoff sederhana. Event berubah menjadi published dan downstream akan sinkron tanpa checkout ulang.

Expected outcome:

- saat broker mati: checkout sukses, outbox `pending`
- setelah broker hidup: event berubah `published`
- admin analytics kembali menunjukkan `synced`

## Scene 8 - Tunjukkan Observability dan Recovery Manual

Layar:

- admin analytics
- admin settings

Narasi:

> Dashboard admin menampilkan service health, queue topology, outbox pipeline, dan recent outbox events. Jika sebuah event sampai status failed, sistem juga menyediakan endpoint retry manual agar operator bisa melakukan recovery terkontrol.

Command opsional:

```powershell
curl -X POST http://localhost:8080/api/orders/outbox/2/retry
```

Expected outcome:

- terlihat gateway URL, RabbitMQ console link, dan queue status di admin settings
- terlihat recent outbox event dan attempt count di admin analytics

## Penutup

Ucapan yang disarankan:

> Dari demo ini terlihat bahwa sistem kami memenuhi requirement utama EAI: service dan database terpisah, integrasi asynchronous lewat broker, API Gateway, minimal tiga EIP, transformasi data heterogen, containerization, dan alur end-to-end. Kami juga menambahkan bonus reliable messaging dan observability yang bisa dibuktikan langsung saat runtime.
