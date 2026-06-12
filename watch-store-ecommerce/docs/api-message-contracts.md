# API and Message Contracts

## Canonical Event `OrderCreated`

Producer:

- `order-api`

Transport:

- Exchange: `watchcommerce.events`
- Incoming routing key: `order.created`
- Downstream routing keys:
  - `integration.inventory.order.created`
  - `integration.accounting.order.created`
  - `integration.crm.order.created`

Payload:

```json
{
  "event_type": "OrderCreated",
  "event_version": "1.0",
  "timestamp": "2026-06-12T07:52:45.327065+00:00",
  "source": "order-api",
  "data": {
    "order_id": "4",
    "customer_id": "max.score@example.com",
    "customer_name": "Max Score",
    "customer_email": "max.score@example.com",
    "customer_phone": "081299998888",
    "shipping_address": "Jl. Sudirman No. 88, Jakarta",
    "currency": "IDR",
    "subtotal": 13300000,
    "tax_amount": 0,
    "shipping_amount": 0,
    "grand_total": 13300000,
    "total_amount": 13300000,
    "status": "CONFIRMED",
    "created_at": "2026-06-12T07:52:45.323236+00:00",
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

## Transactional Outbox Record

Outbox record disimpan di `order_db.outbox_events` dalam transaksi yang sama dengan data order.

Shape:

```json
{
  "event_id": 3,
  "aggregate_type": "order",
  "aggregate_id": "6",
  "event_type": "OrderCreated",
  "payload": {
    "event_type": "OrderCreated",
    "event_version": "1.0",
    "timestamp": "2026-06-12T07:56:50.675439+00:00",
    "source": "order-api",
    "data": {
      "order_id": "6"
    }
  },
  "status": "published",
  "attempt_count": 3,
  "last_error": null,
  "created_at": "2026-06-12T07:56:51",
  "updated_at": "2026-06-12T07:57:12",
  "published_at": "2026-06-12T07:57:12"
}
```

Status lifecycle:

- `pending`: event sudah aman di database dan menunggu publish atau retry berikutnya
- `published`: event berhasil dipublish ke RabbitMQ
- `failed`: retry otomatis habis dan perlu manual retry

## Order API Outbox Endpoints

### `GET /api/orders/outbox`

Response:

```json
{
  "summary": {
    "total": 3,
    "pending": 0,
    "published": 3,
    "failed": 0
  },
  "items": [
    {
      "event_id": 3,
      "aggregate_type": "order",
      "aggregate_id": "6",
      "event_type": "OrderCreated",
      "payload": {
        "event_type": "OrderCreated",
        "data": {
          "order_id": "6"
        }
      },
      "status": "published",
      "attempt_count": 3,
      "last_error": null,
      "created_at": "2026-06-12T07:56:51",
      "updated_at": "2026-06-12T07:57:12",
      "published_at": "2026-06-12T07:57:12"
    }
  ]
}
```

### `POST /api/orders/outbox/{event_id}/retry`

Response:

```json
{
  "message": "Outbox event #2 re-queued for publishing.",
  "event": {
    "event_id": 2,
    "aggregate_type": "order",
    "aggregate_id": "5",
    "event_type": "OrderCreated",
    "status": "pending",
    "attempt_count": 0,
    "last_error": null,
    "published_at": null
  }
}
```

## Observability Endpoint

### `GET /api/admin/observability`

Endpoint ini menggabungkan health service, business snapshot, outbox summary, queue stats RabbitMQ, dan status sinkronisasi per domain.

Response shape:

```json
{
  "status": "ok",
  "generated_at": "2026-06-12T07:57:48.046266+00:00",
  "services": {
    "order": {
      "status": "ok",
      "service": "order-api",
      "outbox": {
        "total": 3,
        "pending": 0,
        "published": 3,
        "failed": 0
      }
    },
    "inventory": {
      "status": "ok",
      "service": "inventory-api"
    },
    "accounting": {
      "status": "ok",
      "service": "WatchCommerce Accounting API"
    },
    "crm": {
      "status": "ok",
      "service": "crm-api"
    }
  },
  "business_snapshot": {
    "counts": {
      "orders": 6,
      "inventory_products": 4,
      "inventory_reservations": 6,
      "invoices": 6,
      "crm_purchases": 6
    }
  },
  "outbox": {
    "summary": {
      "total": 3,
      "pending": 0,
      "published": 3,
      "failed": 0
    },
    "items": []
  },
  "messaging": {
    "status": "ok",
    "console_url": "http://localhost:15672",
    "queues": [
      {
        "name": "integration.router.order.created",
        "state": "running",
        "messages": 0,
        "messages_ready": 0,
        "messages_unacknowledged": 0,
        "consumers": 1
      }
    ]
  },
  "latest_integration": {
    "order": {
      "id": 6
    },
    "downstream": {
      "inventory": {
        "status": "synced",
        "expected_order_id": "6",
        "observed_order_id": "6"
      },
      "accounting": {
        "status": "synced",
        "expected_order_id": "6",
        "observed_order_id": "6"
      },
      "crm": {
        "status": "synced",
        "expected_order_id": "6",
        "observed_order_id": "6"
      }
    }
  }
}
```

## Downstream Internal Contracts

### Inventory

Endpoint:

- `POST /api/inventory/internal/order-events/order-created`

Response example:

```json
{
  "message": "Inventory reserved from OrderCreated event.",
  "created": true,
  "reservation": {
    "order_id": "6",
    "status": "RESERVED"
  }
}
```

### Accounting

Endpoint:

- `POST /api/v1/internal/order-events/order-created`

Response example:

```json
{
  "message": "Invoice created from OrderCreated event.",
  "created": true,
  "invoice": {
    "order_id": "6",
    "event_name": "OrderCreated"
  }
}
```

### CRM

Endpoint:

- `POST /api/crm/internal/order-events/order-created`

Response example:

```json
{
  "message": "Purchase history created from OrderCreated event.",
  "created": true,
  "purchase": {
    "order_id": "6",
    "status": "CONFIRMED"
  }
}
```

## JSON to XML Transformation

Input JSON:

```json
{
  "event_type": "OrderCreated",
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

Output XML:

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
  <items>
    <item>
      <product_name>Cool Decade</product_name>
      <quantity>1</quantity>
      <unit_price>1100000.00</unit_price>
      <line_total>1100000.00</line_total>
    </item>
  </items>
</invoice>
```

## Reliable Messaging Scenario: Before and After

### Saat broker mati

```json
{
  "event_id": 3,
  "aggregate_id": "6",
  "status": "pending",
  "attempt_count": 1,
  "last_error": "[Errno -5] No address associated with hostname",
  "published_at": null
}
```

### Setelah broker pulih

```json
{
  "event_id": 3,
  "aggregate_id": "6",
  "status": "published",
  "attempt_count": 3,
  "last_error": null,
  "published_at": "2026-06-12T07:57:12"
}
```

Makna skenario:

- order tidak hilang saat broker tidak tersedia
- event tidak dikirim dari memori sementara, tetapi dari outbox persisten
- downstream tetap satu kali proses karena setiap domain idempotent terhadap `order_id`
