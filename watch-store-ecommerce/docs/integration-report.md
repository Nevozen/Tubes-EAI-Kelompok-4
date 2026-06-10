# Integration Report

## Ringkasan Arsitektur
- Gaya integrasi utama adalah asynchronous event-driven integration menggunakan RabbitMQ.
- `order-api` menerbitkan canonical `OrderCreated` event.
- `integration-router` memisahkan concern routing dari service bisnis.
- Adapter microservices mengubah message consumption menjadi HTTP calls yang aman ke service downstream.
- `api-gateway` menyediakan API-led integration untuk client eksternal dan overview agregat untuk demo/admin.

## Enterprise Integration Patterns yang Diimplementasikan

| EIP | Implementasi |
|---|---|
| Message Channel | Exchange `watchcommerce.events` dan queue adapter pada RabbitMQ |
| Message Router | `integration-router` merutekan satu event canonical ke tiga routing key downstream |
| Message Translator | `accounting-api` mentransformasikan JSON order event menjadi XML invoice |
| Message Endpoint / Adapter | `order-api` sebagai producer endpoint, adapter services sebagai consumer endpoint |
| Aggregator | `api-gateway` menggabungkan data order, inventory, accounting, dan CRM |

## Mapping Data
- `order_id` canonical digunakan sebagai kunci idempotensi di inventory, accounting, dan CRM.
- `customer_email` dipakai sebagai fallback `customer_id` lintas service untuk konsistensi.
- `items[].product_id` dan `items[].quantity` dipakai inventory untuk reserve stock.
- `grand_total`, `currency`, dan `items[]` dipakai accounting untuk membentuk invoice XML.
- `customer_name`, `customer_email`, `grand_total`, dan jumlah item dipakai CRM untuk purchase history.

## Bukti Loose Coupling
- Tidak ada service yang query database service lain.
- Integrasi domain dilakukan lewat broker dan internal HTTP API.
- Inventory, accounting, dan CRM dapat diubah implementasi databasenya tanpa mengubah `order-api`, selama kontrak event/internal API tetap sama.

## Ketahanan dan Persistensi
- RabbitMQ memakai named volume `rabbitmq_data`.
- Seluruh database MySQL memakai named volume masing-masing.
- Queue dan message broker di-set durable, message dipublish dengan `delivery_mode=2`.
- Inventory, accounting, dan CRM memproses `order_id` secara idempotent agar replay event tidak menggandakan side effect.

## Tradeoff dan Keputusan Desain
- Database runtime memakai MySQL per service untuk memenuhi requirement pemisahan database yang jelas saat demo Docker.
- Adapter layer dipilih dibanding consumer langsung di service bisnis agar integration layer benar-benar terpisah.
- Gateway dibuat dengan FastAPI agar mudah menambah endpoint agregasi tanpa memperkenalkan stack tambahan.

## Kontribusi Tim
Gunakan tabel ini sebagai baseline akhir dan sesuaikan jika pembagian real berbeda saat pengumpulan.

| Anggota | Fokus Kontribusi |
|---|---|
| Naufal | Order API, canonical event publisher, docker runtime |
| Imanuel | Inventory API, reservation flow, seed dan verifikasi stok |
| Radiv | Accounting API, JSON to XML, dokumentasi message contract |
| Zhafir | CRM API, API Gateway, diagram, demo checklist, laporan |

## Kendala dan Solusi
- Kendala: route dinamis berpotensi menelan route aksi seperti `checkout` atau `reserve`.
  Solusi: route spesifik ditempatkan sebelum route dinamis dan inventory reservation dipisah ke path khusus.
- Kendala: user `guest` RabbitMQ tidak aman untuk komunikasi antar-container.
  Solusi: stack memakai credential RabbitMQ khusus via environment variable.
- Kendala: requirement integration layer terpisah tidak terpenuhi jika consumer ditanam di service bisnis.
  Solusi: semua side effect downstream dipindahkan ke router dan adapter layer.
