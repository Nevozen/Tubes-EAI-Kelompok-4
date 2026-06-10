# Quality Check — WatchCommerce Integration System
**Mata Kuliah:** Enterprise Application Integration  
**Kelompok:** 4 (Naufal, Imanuel, Radiv, Zhafir)  
**Repository:** https://github.com/Nevozen/Tubes-EAI-Kelompok-4.git

---

## C. Spesifikasi Teknis WAJIB

### ✅/❌ Checklist

| No | Requirement | Detail | Status |
|----|-------------|--------|--------|
| C1 | **Minimal 3 aplikasi/sistem terpisah**, masing-masing dengan database sendiri | Order API (`order_db`), Inventory API (`inventory_db`), Accounting API (`accounting_db`), CRM API (`crm_db`) — **4 sistem** | ☐ |
| C2 | **Dilarang akses langsung antar database** — harus lewat lapisan integrasi | Semua komunikasi antar service harus melewati RabbitMQ, bukan direct DB call | ☐ |
| C3 | **Lapisan integrasi sebagai microservices** — adapter/connector, router, transformer | Cek apakah ada komponen dedicated untuk integration layer (bukan hanya consumer di dalam service masing-masing) | ☐ |
| C4 | **Heterogenitas data** — minimal satu alur transformasi antar format berbeda | Accounting/Billing API: JSON → XML invoice (sudah direncanakan di proposal) | ☐ |
| C5 | **Messaging / Message Broker** (RabbitMQ, Kafka, dll.) untuk integrasi asinkron | RabbitMQ digunakan, exchange `order.created` | ☐ |
| C5b | **API-led integration** (REST/gRPC/SOAP) di belakang API Gateway (opsional kombinasi) | Cek apakah ada API Gateway yang menghadap ke luar | ☐ |
| C6 | **Enterprise Integration Patterns — minimal 3 pola**, dijelaskan di laporan | Lihat tabel EIP di bawah | ☐ |
| C7 | **Containerization** — tiap komponen punya Dockerfile, jalankan dengan satu perintah `docker-compose up` | Cek Dockerfile per service + `docker-compose.yml` | ☐ |
| C8 | **Konfigurasi via environment variable** — endpoint, kredensial, nama queue tidak boleh hardcode | Cek `.env` / `environment:` di docker-compose, tidak ada string hardcoded di source code | ☐ |
| C9 | **Persistensi & ketahanan** — volume untuk data, broker/antrian bertahan saat restart | Cek `volumes:` di docker-compose untuk setiap DB dan RabbitMQ | ☐ |
| C10 | **Demo alur end-to-end** — 1 event di satu sistem memicu pembaruan otomatis di sistem lain | Checkout → `OrderCreated` → Inventory berkurang + Accounting tercatat + CRM tersimpan | ☐ |

---

## EIP — Enterprise Integration Patterns (Minimal 3)

Tandai pola mana yang sudah diimplementasikan dan dijelaskan di laporan:

| Pola EIP | Deskripsi Singkat | Diimplementasikan? | Dijelaskan di Laporan? |
|----------|-------------------|-------------------|----------------------|
| Message Channel | Saluran komunikasi antara producer & consumer (queue RabbitMQ) | ☐ | ☐ |
| Message Router / Content-Based Router | Routing pesan ke consumer yang tepat berdasarkan isi/tipe event | ☐ | ☐ |
| Message Translator | Transformasi format data — JSON → XML untuk Accounting | ☐ | ☐ |
| Message Endpoint / Adapter | Tiap service sebagai endpoint yang terhubung ke broker | ☐ | ☐ |
| Publish-Subscribe | Order API publish ke exchange, multiple consumer subscribe | ☐ | ☐ |
| Aggregator | (Jika ada) Menggabungkan response dari beberapa sistem | ☐ | ☐ |
| Canonical Data Model | Format pertukaran data internal yang konsisten antar sistem | ☐ | ☐ |

> **Minimal 3 pola harus tercentang di kolom "Diimplementasikan" DAN "Dijelaskan di Laporan".**

---

## D. Spesifikasi Tambahan (Bonus)

| Bonus | Detail | Status |
|-------|--------|--------|
| +2 — Reliable messaging | Retry, dead-letter queue, atau idempotency anti-duplikat | ☐ |
| +1 — Canonical Data Model konsisten | Format pertukaran internal yang baku dipakai semua service | ☐ |
| +2 — Orkestrasi lintas sistem | Saga/workflow sederhana vs choreography | ☐ |
| +2 — Monitoring/observability | Dashboard antrian RabbitMQ, distributed tracing | ☐ |
| +2 — Deploy ke Kubernetes | Scaling pada layanan integrasi | ☐ |

---

## E. Deliverable yang Harus Dikumpulkan

| No | Deliverable | Status |
|----|-------------|--------|
| E1 | **Repository kode** (GitHub/GitLab) — seluruh aplikasi + lapisan integrasi | ☐ |
| E2 | **Dockerfile** tiap komponen + `docker-compose.yml` / manifest Kubernetes | ☐ |
| E3 | **Diagram arsitektur integrasi** — tiap sistem, broker/gateway, adapter, alur pesan, label EIP | ☐ |
| E4 | **README.md** — deskripsi, daftar sistem & endpoint, format data, cara menjalankan (`clone → docker compose up → aktif`) | ☐ |
| E5 | **Dokumentasi API & skema pesan** (Swagger/OpenAPI, contoh payload sebelum & sesudah transformasi) | ☐ |
| E6 | **Laporan singkat (4–6 halaman)** — gaya integrasi, pola EIP + justifikasi, mapping data, pembagian tugas, kendala & solusi | ☐ |
| E7 | **Video demo (5–10 menit)** — jalankan dari nol, demo 1 alur end-to-end, tunjukkan event memicu perubahan di sistem lain | ☐ |

---

## G. Rubrik Penilaian (Self-Assessment)

| No | Aspek | Poin Maks | Estimasi Skor |
|----|-------|-----------|---------------|
| 1 | Fungsionalitas integrasi — alur end-to-end berjalan | 20 | — |
| 2 | Penerapan gaya & pola EIP — ≥3 pola, dijelaskan dengan benar | 20 | — |
| 3 | Transformasi & heterogenitas data — mapping JSON↔XML berfungsi | 10 | — |
| 4 | Arsitektur microservices — pemisahan sistem, DB per service, loose coupling | 10 | — |
| 5 | Containerization & orkestrasi — build & `docker compose up` berhasil | 15 | — |
| 6 | Konfigurasi & keamanan — env var, tidak ada akses DB lintas sistem | 5 | — |
| 7 | Dokumentasi — README, diagram, skema pesan, laporan jelas & replicable | 10 | — |
| 8 | Presentasi & video demo — jelas, tim memahami keputusan desain | 10 | — |
| **Total** | | **100** | — |
| Bonus (maks) | | **+10** | — |

---

## Catatan Tambahan / Temuan

> Gunakan bagian ini untuk mencatat bug, hal yang masih belum selesai, atau keputusan desain yang perlu didiskusikan.

- [ ] Pastikan `docker-compose up` berhasil dijalankan dari nol (fresh clone, tanpa manual setup)
- [ ] Verifikasi bahwa tidak ada service yang melakukan direct DB query ke database milik service lain
- [ ] Cek transformasi JSON → XML di Accounting API benar-benar menghasilkan XML yang valid
- [ ] Pastikan RabbitMQ menggunakan named volume agar data antrian persist saat container restart
- [ ] Semua kredensial DB dan RabbitMQ harus dari environment variable (`.env`), bukan hardcoded
- [ ] Diagram arsitektur harus memberi label nama EIP pada tiap komponen/alur
- [ ] Laporan harus mencantumkan kontribusi tiap anggota (ketentuan H)
- [ ] Payload contoh sebelum & sesudah transformasi harus ada di dokumentasi API
