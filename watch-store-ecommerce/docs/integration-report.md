# Integration Report

## 1. Latar Belakang Masalah

WatchCommerce dimodelkan sebagai organisasi yang memiliki beberapa domain bisnis terpisah: pemesanan, inventori, akuntansi, dan customer relationship management. Jika setiap domain saling mengakses database secara langsung, maka sistem akan sangat rapuh terhadap perubahan schema, sulit diskalakan, dan menimbulkan coupling yang tinggi. Selain itu, kebutuhan presentasi proyek mengharuskan adanya bukti bahwa satu event di sistem asal dapat memicu pembaruan otomatis di sistem lain tanpa query database lintas domain.

Karena itu, pendekatan yang dipilih adalah Enterprise Application Integration berbasis event-driven messaging dengan API Gateway di sisi luar. Pendekatan ini memungkinkan setiap service menyimpan data pada database sendiri, tetapi tetap berkolaborasi melalui message contract yang baku dan integration layer yang terpisah dari business service.

## 2. Tujuan Desain

Tujuan desain integrasi ini adalah:

- memisahkan concern tiap domain bisnis ke service dan database yang berbeda
- memastikan tidak ada cross-database access
- menyediakan alur checkout yang dapat memicu sinkronisasi otomatis ke inventory, accounting, dan CRM
- menunjukkan penerapan beberapa Enterprise Integration Patterns secara nyata
- menjaga reliabilitas alur asinkron ketika broker sedang tidak tersedia
- menyediakan observability yang mudah didemokan pada saat presentasi

## 3. Arsitektur yang Dipilih

Arsitektur akhir terdiri dari komponen berikut:

- `order-api` sebagai producer checkout dan canonical event
- `order-outbox-publisher` sebagai worker publisher untuk transactional outbox
- `rabbitmq` sebagai broker
- `integration-router` sebagai router pesan
- `inventory-adapter`, `accounting-adapter`, dan `crm-adapter` sebagai adapter microservices
- `inventory-api`, `accounting-api`, dan `crm-api` sebagai business service target
- `api-gateway` sebagai external entrypoint dan aggregator observability
- `frontend-web` sebagai admin/demo interface

Setiap business service memiliki database sendiri:

- `order_db`
- `inventory_db`
- `accounting_db`
- `crm_db`

Desain ini memenuhi requirement pemisahan sistem dan database, serta membuat integration layer terlihat jelas sebagai microservices tersendiri, bukan sekadar consumer yang ditanam di service bisnis.

## 4. Gaya Integrasi

Gaya integrasi utama adalah kombinasi:

- asynchronous event-driven integration untuk alur lintas domain
- API-led integration melalui gateway untuk akses client eksternal
- point-to-point internal HTTP call dari adapter ke target service untuk boundary domain yang jelas

Service asal checkout tidak mengetahui detail implementasi inventory, accounting, ataupun CRM. Ia hanya menghasilkan canonical `OrderCreated`, sedangkan routing dan delivery ke domain lain didelegasikan ke integration layer.

## 5. Enterprise Integration Patterns yang Diimplementasikan

### 5.1 Message Channel

RabbitMQ exchange `watchcommerce.events` dan queue downstream menjadi saluran komunikasi utama antar service. Pattern ini memisahkan producer dari consumer, sehingga order service tidak harus mengetahui siapa saja yang akan memproses event tersebut.

### 5.2 Message Router

`integration-router` menerima event canonical dari queue `integration.router.order.created`, kemudian merutekannya ke:

- `integration.inventory.order.created`
- `integration.accounting.order.created`
- `integration.crm.order.created`

Routing ini menjaga agar `order-api` tetap mem-publish satu event canonical tanpa perlu menulis logika dispatch ke banyak target.

### 5.3 Message Endpoint

Endpoint pengirim ada pada `order-api`, sedangkan endpoint penerima ada pada adapter dan service internal downstream. Setiap komponen berkomunikasi melalui boundary yang eksplisit, baik queue maupun internal REST endpoint.

### 5.4 Adapter

`inventory-adapter`, `accounting-adapter`, dan `crm-adapter` mengubah message consumption menjadi HTTP call ke internal API masing-masing service. Pattern ini penting untuk menunjukkan bahwa integration layer benar-benar terpisah dari business service.

### 5.5 Message Translator

`accounting-api` melakukan transformasi heterogenitas data dari JSON canonical event menjadi XML invoice. Ini menjadi bukti requirement data heterogeneity pada proyek.

### 5.6 Aggregator

`api-gateway` menggabungkan data dari order, inventory, accounting, dan CRM untuk endpoint:

- `GET /api/admin/integration-overview`
- `GET /api/admin/observability`

Pattern ini memudahkan admin dan dosen melihat status keseluruhan sistem dari satu endpoint.

### 5.7 Canonical Data Model

Event `OrderCreated` dipakai sebagai format pertukaran internal yang konsisten untuk semua downstream. Dengan begitu, inventory, accounting, dan CRM tidak perlu memiliki kontrak input yang berbeda-beda untuk event yang sama.

## 6. Heterogenitas Data dan Mapping

Canonical event berformat JSON memiliki field umum seperti:

- `order_id`
- `customer_name`
- `customer_email`
- `currency`
- `grand_total`
- `status`
- `items[]`

Field-field ini kemudian dipetakan sesuai kebutuhan domain:

- Inventory memakai `order_id`, `product_id`, `quantity`, dan `product_name`
- Accounting memakai `order_id`, `customer`, `grand_total`, `currency`, dan `items[]` untuk membentuk XML invoice
- CRM memakai `order_id`, `customer_email`, `customer_name`, `grand_total`, dan jumlah item

Contoh transformasi heterogen:

- input: JSON canonical `OrderCreated`
- output: XML invoice pada `accounting-api`

Kelebihan pendekatan ini adalah canonical model dapat tetap stabil walaupun format representasi domain tertentu berbeda.

## 7. Desain Reliable Messaging

### 7.1 Masalah pada pendekatan publish langsung

Jika order disimpan ke database lalu publish ke broker dilakukan secara best effort setelah commit, maka ada risiko order berhasil tersimpan tetapi event hilang ketika broker sedang down. Ini akan menyebabkan state tidak sinkron antar domain.

### 7.2 Solusi: Transactional Outbox

Pada implementasi akhir, `order-api` menyimpan tiga jenis data dalam satu transaksi:

1. `orders`
2. `order_items`
3. `outbox_events`

Jika transaksi berhasil, maka event canonical pasti aman di database meskipun RabbitMQ sedang mati. Setelah itu `order-outbox-publisher` akan membaca outbox secara terpisah dan mencoba publish ke broker.

### 7.3 Retry dan Backoff

Publisher worker menerapkan:

- status event: `pending`, `published`, `failed`
- `attempt_count`
- `last_error`
- `published_at`
- retry terbatas
- backoff sederhana berbasis `OUTBOX_POLL_INTERVAL_SECONDS`

Desain ini cukup kuat untuk bonus reliable messaging tanpa memperluas scope ke saga atau DLQ pada hari implementasi.

### 7.4 Idempotency Downstream

Inventory, accounting, dan CRM menggunakan `order_id` sebagai kunci idempotensi. Dengan demikian replay event:

- tidak membuat stok ter-reserve dua kali
- tidak membuat invoice dobel
- tidak membuat purchase history dobel

### 7.5 Manual Recovery

Jika event sudah mencapai status `failed`, sistem menyediakan:

- `POST /api/orders/outbox/{event_id}/retry`

Endpoint ini me-reset state event agar dapat dipublish ulang oleh worker.

## 8. Desain Observability

Untuk bonus observability, gateway menyediakan:

- `GET /api/admin/observability`

Endpoint ini menggabungkan:

- health tiap service
- summary outbox order
- recent outbox events
- statistik queue dari RabbitMQ Management API
- status sinkronisasi downstream untuk order terbaru

Selain endpoint JSON, frontend admin juga menampilkan panel observability berisi:

- connected service health
- queue topology dan consumer count
- outbox pipeline summary
- latest downstream synchronization
- recent outbox events

Observability ini berguna bukan hanya untuk demo, tetapi juga untuk menjelaskan kondisi sistem ketika broker mati, saat retry berjalan, dan setelah sinkronisasi pulih.

## 9. Hasil Uji End-to-End

Berikut hasil uji yang berhasil diverifikasi pada implementasi akhir:

### 9.1 Validasi containerization

- `docker compose config` valid
- `docker compose up --build -d` sukses dari root project
- semua container penting naik dan sehat

### 9.2 Checkout normal

Saat checkout normal dilakukan:

- order baru tersimpan di `order_db`
- outbox event tercatat dan berubah ke `published`
- inventory reservation tercatat
- invoice XML tercatat di accounting
- purchase history tercatat di CRM
- observability menunjukkan downstream `synced`

### 9.3 Skenario broker mati sementara

Saat RabbitMQ dimatikan:

- checkout tetap mengembalikan sukses
- order tetap tersimpan
- outbox event berstatus `pending`
- `attempt_count` meningkat dan `last_error` terisi

Setelah RabbitMQ dinyalakan kembali:

- publisher worker berhasil mem-publish event
- status event berubah menjadi `published`
- downstream sinkron otomatis tanpa checkout ulang

### 9.4 Manual retry

Satu event yang sebelumnya `failed` berhasil direqueue melalui endpoint retry manual dan kemudian menjadi `published`. Ini membuktikan adanya jalur recovery operasional yang jelas.

### 9.5 Verifikasi visual admin

Admin analytics dan settings berhasil menampilkan:

- outbox count
- queue stats RabbitMQ
- status health service
- sinkronisasi inventory/accounting/CRM
- URL gateway dan RabbitMQ console

## 10. Kendala dan Solusi

### Kendala 1: artefak runtime dan konfigurasi masih ter-track

Masalah:

- file `.env`, `__pycache__`, dan database lokal dapat menurunkan kualitas repo saat dinilai

Solusi:

- menambahkan `.gitignore`
- mengeluarkan artefak dev dari version control
- memastikan kredensial dan endpoint dipindah ke environment variable

### Kendala 2: race condition saat boot `order-api` dan publisher

Masalah:

- `order-api` dan `order-outbox-publisher` sempat sama-sama menyentuh schema order saat start

Solusi:

- publisher tidak lagi melakukan schema creation
- publisher menunggu schema siap dan tetap hidup untuk retry

### Kendala 3: retry terlalu agresif

Masalah:

- event bisa cepat habis retry sebelum broker sempat pulih

Solusi:

- menambahkan retry backoff sederhana agar event tetap bertahan dalam window pemulihan yang realistis

### Kendala 4: observability salah membaca replay event lama

Masalah:

- jika event order lama diproses belakangan, downstream record terbaru belum tentu milik order terbaru

Solusi:

- observability menghitung status sinkron berdasarkan lookup `order_id` terbaru per domain, bukan sekadar item paling baru di list

## 11. Pembagian Tugas

Silakan sesuaikan nama dan detail akhir jika pembagian real di tim berbeda, namun baseline kontribusi yang terdokumentasi adalah:

| Anggota | Kontribusi Utama |
|---|---|
| Naufal | Order API, checkout flow, outbox publisher, Docker runtime |
| Imanuel | Inventory API, reservation flow, seed stok, validasi inventory |
| Radiv | Accounting API, JSON to XML, invoice contract, verifikasi billing |
| Zhafir | CRM API, API Gateway, observability, diagram, README, script demo, laporan |

## 12. Kesimpulan

Implementasi WatchCommerce memenuhi requirement inti proyek EAI:

- minimal tiga sistem terpisah dengan database masing-masing
- tidak ada akses database lintas service
- messaging broker dan API Gateway digunakan bersamaan
- lebih dari tiga EIP benar-benar diterapkan
- ada heterogenitas data melalui transformasi JSON ke XML
- seluruh stack dapat dijalankan dengan Docker Compose

Selain itu, implementasi juga menambahkan dua bonus yang realistis dan kuat untuk didemokan:

- reliable messaging melalui transactional outbox, retry, dan idempotency
- observability melalui endpoint agregat, RabbitMQ management stats, dan dashboard admin live

Dengan kombinasi implementasi teknis, bukti runtime, dan dokumentasi yang selaras, repositori ini sudah disiapkan agar kuat saat dinilai maupun saat didemokan langsung.
