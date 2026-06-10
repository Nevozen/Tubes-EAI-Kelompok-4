# Integration Architecture

```mermaid
flowchart LR
    FE["Frontend / Demo Client"] --> GW["API Gateway\n(EIP: Aggregator + API-led entrypoint)"]
    GW --> O["Order API"]
    GW --> I["Inventory API"]
    GW --> A["Accounting API"]
    GW --> C["CRM API"]

    O --> ODB[("order_db")]
    I --> IDB[("inventory_db")]
    A --> ADB[("accounting_db")]
    C --> CDB[("crm_db")]

    O -- "publish OrderCreated\n(EIP: Message Endpoint)" --> EX["RabbitMQ Exchange\nwatchcommerce.events\n(EIP: Message Channel)"]
    EX --> RQ["integration.router.order.created"]
    RQ --> R["Integration Router\n(EIP: Message Router)"]

    R -- "integration.inventory.order.created" --> IQ["Inventory Adapter Queue"]
    R -- "integration.accounting.order.created" --> AQ["Accounting Adapter Queue"]
    R -- "integration.crm.order.created" --> CQ["CRM Adapter Queue"]

    IQ --> IA["Inventory Adapter\n(EIP: Message Endpoint / Adapter)"]
    AQ --> AA["Accounting Adapter\n(EIP: Message Endpoint / Adapter)"]
    CQ --> CA["CRM Adapter\n(EIP: Message Endpoint / Adapter)"]

    IA --> I
    AA --> A
    CA --> C

    A --> XML["Invoice XML\n(EIP: Message Translator)"]
```

## Komponen
- `order-api` adalah producer canonical event `OrderCreated`.
- `integration-router` menjadi consumer tunggal untuk routing event canonical.
- Adapter layer bertanggung jawab menerjemahkan message broker menjadi HTTP call ke service bisnis.
- `api-gateway` menggabungkan response dari beberapa service untuk kebutuhan admin/demo.

## Bukti Tidak Ada Cross-DB Access
- `order-api` hanya terhubung ke `order_db`.
- `inventory-api` hanya terhubung ke `inventory_db`.
- `accounting-api` hanya terhubung ke `accounting_db`.
- `crm-api` hanya terhubung ke `crm_db`.
- Side effect antar domain selalu melalui `RabbitMQ -> Router -> Adapter -> HTTP API`.
