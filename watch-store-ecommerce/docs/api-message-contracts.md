# API and Message Contracts

## Canonical `OrderCreated` Event

Producer:
- `order-api`

Exchange and routing:
- Exchange: `watchcommerce.events`
- Incoming routing key: `order.created`
- Routed downstream keys:
  - `integration.inventory.order.created`
  - `integration.accounting.order.created`
  - `integration.crm.order.created`

Payload:

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
      },
      {
        "product_id": 3,
        "product_name": "Cool Decade",
        "sku": null,
        "quantity": 2,
        "unit_price": 1100000,
        "price": 1100000,
        "line_total": 2200000,
        "subtotal": 2200000
      }
    ]
  }
}
```

## Inventory Internal API

Endpoint:
- `POST /api/inventory/internal/order-events/order-created`

Request shape:
- Menggunakan canonical `OrderCreated` event apa adanya.

Response shape:

```json
{
  "message": "Inventory reserved from OrderCreated event.",
  "created": true,
  "reservation": {
    "id": 1,
    "order_id": "1",
    "event_name": "OrderCreated",
    "status": "RESERVED",
    "customer_email": "alya@example.com",
    "total_items": 3,
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "White Decade",
        "quantity": 1,
        "unit_price": 12450000,
        "line_total": 12450000
      }
    ]
  }
}
```

## CRM Internal API

Endpoint:
- `POST /api/crm/internal/order-events/order-created`

Request shape:
- Menggunakan canonical `OrderCreated` event apa adanya.

Response shape:

```json
{
  "message": "Purchase history created from OrderCreated event.",
  "created": true,
  "purchase": {
    "id": 1,
    "order_id": "1",
    "customer_id": "alya@example.com",
    "customer_name": "Alya",
    "customer_email": "alya@example.com",
    "total_price": 14650000.0,
    "status": "CONFIRMED",
    "item_count": 2
  }
}
```

## Accounting JSON to XML Transformation

JSON input diterima di:
- `POST /api/v1/internal/order-events/order-created`

Contoh JSON yang diproses:

```json
{
  "event_type": "OrderCreated",
  "data": {
    "order_id": "1",
    "customer_name": "Alya",
    "customer_email": "alya@example.com",
    "currency": "IDR",
    "grand_total": 14650000,
    "status": "CONFIRMED",
    "items": [
      {
        "product_name": "White Decade",
        "quantity": 1,
        "unit_price": 12450000,
        "line_total": 12450000
      }
    ]
  }
}
```

Contoh XML output:

```xml
<?xml version="1.0" ?>
<invoice>
  <invoice_number>INV-20260610141000-1</invoice_number>
  <event_name>OrderCreated</event_name>
  <order_id>1</order_id>
  <customer>
    <customer_name>Alya</customer_name>
    <customer_email>alya@example.com</customer_email>
  </customer>
  <amounts>
    <currency>IDR</currency>
    <grand_total>14650000.00</grand_total>
    <status>CONFIRMED</status>
  </amounts>
  <items>
    <item>
      <product_name>White Decade</product_name>
      <quantity>1</quantity>
      <unit_price>12450000.00</unit_price>
      <line_total>12450000.00</line_total>
    </item>
  </items>
</invoice>
```
