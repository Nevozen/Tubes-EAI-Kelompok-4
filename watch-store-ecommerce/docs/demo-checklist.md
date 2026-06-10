# Demo Checklist

## Persiapan
1. Pastikan Docker Desktop aktif.
2. Dari root project, jalankan:

```powershell
docker compose up --build -d
```

3. Tunggu semua container `healthy` atau `running`.

## Alur Demo 5-10 Menit
1. Buka RabbitMQ dashboard di `http://localhost:15672`.
2. Login memakai credential dari `.env`.
3. Tunjukkan queue berikut:
   - `integration.router.order.created`
   - `integration.inventory.order.created`
   - `integration.accounting.order.created`
   - `integration.crm.order.created`
4. Seed inventory:

```powershell
curl -X POST http://localhost:8080/api/inventory/seed
```

5. Tampilkan stok awal:

```powershell
curl http://localhost:8080/api/inventory
```

6. Lakukan checkout melalui gateway:

```powershell
curl -X POST http://localhost:8080/api/orders/checkout ^
  -H "Content-Type: application/json" ^
  -d "{\"customer_name\":\"Alya\",\"customer_email\":\"alya@example.com\",\"customer_phone\":\"081234567890\",\"shipping_address\":\"Jl. Asia Afrika No. 10, Bandung\",\"items\":[{\"product_id\":1,\"product_name\":\"White Decade\",\"quantity\":1,\"price\":12450000},{\"product_id\":3,\"product_name\":\"Cool Decade\",\"quantity\":2,\"price\":1100000}]}"
```

7. Tunjukkan bahwa event muncul di RabbitMQ dan terdistribusi ke adapter queue.
8. Verifikasi inventory ter-update:

```powershell
curl http://localhost:8080/api/inventory/order-reservations
curl http://localhost:8080/api/inventory
```

9. Verifikasi accounting ter-update:

```powershell
curl http://localhost:8080/api/accounting/invoices
curl http://localhost:8080/api/accounting/invoices/1/xml
```

10. Verifikasi CRM ter-update:

```powershell
curl http://localhost:8080/api/crm/purchases
```

11. Tunjukkan overview agregat:

```powershell
curl http://localhost:8080/api/admin/integration-overview
```

## Checklist Verifikasi
- Order tersimpan di `order_db`
- Stok produk berkurang dan reservation tercatat di `inventory_db`
- Invoice XML tercatat di `accounting_db`
- Purchase history tercatat di `crm_db`
- Tidak ada direct database access antar service
- Semua komponen berjalan dari `docker compose up --build`
