import asyncio
import os
from typing import Any

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

ORDER_API_URL = os.getenv("ORDER_API_URL", "http://order-api:8001")
INVENTORY_API_URL = os.getenv("INVENTORY_API_URL", "http://inventory-api:8002")
ACCOUNTING_API_URL = os.getenv("ACCOUNTING_API_URL", "http://accounting-api:8003")
CRM_API_URL = os.getenv("CRM_API_URL", "http://crm-api:8000")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "15"))
CORS_ALLOW_ORIGINS = [
    origin.strip()
    for origin in os.getenv("GATEWAY_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    if origin.strip()
]

HOP_BY_HOP_HEADERS = {
    "connection",
    "content-length",
    "transfer-encoding",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "upgrade",
}

app = FastAPI(
    title="WatchCommerce API Gateway",
    description="Single external entrypoint for the WatchCommerce integration stack.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _forward_headers(request: Request) -> dict[str, str]:
    headers = {}
    for name in ("accept", "content-type"):
        value = request.headers.get(name)
        if value:
            headers[name] = value
    return headers


async def proxy_request(request: Request, target_url: str) -> Response:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        upstream = await client.request(
            method=request.method,
            url=target_url,
            params=request.query_params,
            content=await request.body(),
            headers=_forward_headers(request),
        )

    response_headers = {
        key: value
        for key, value in upstream.headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
        media_type=upstream.headers.get("content-type"),
    )


async def fetch_json(client: httpx.AsyncClient, url: str, default: Any) -> Any:
    try:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()
    except Exception:
        return default


def _join_target(base_url: str, service_prefix: str, path: str) -> str:
    suffix = f"/{path}" if path else ""
    return f"{base_url}{service_prefix}{suffix}"


@app.get("/")
def root():
    return {
        "service": "api-gateway",
        "docs": "/docs",
        "routes": [
            "/api/orders",
            "/api/inventory",
            "/api/accounting",
            "/api/crm",
            "/api/admin/integration-overview",
        ],
    }


@app.get("/health")
async def health():
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        order, inventory, accounting, crm = await asyncio.gather(
            fetch_json(client, f"{ORDER_API_URL}/health", {"status": "error"}),
            fetch_json(client, f"{INVENTORY_API_URL}/api/inventory/health", {"status": "error"}),
            fetch_json(client, f"{ACCOUNTING_API_URL}/api/v1/health", {"status": "error"}),
            fetch_json(client, f"{CRM_API_URL}/api/crm/health", {"status": "error"}),
        )

    return {
        "status": "ok",
        "services": {
            "order": order,
            "inventory": inventory,
            "accounting": accounting,
            "crm": crm,
        },
    }


@app.get("/api/admin/integration-overview")
async def integration_overview():
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        orders, inventory, reservations, invoices, purchases = await asyncio.gather(
            fetch_json(client, f"{ORDER_API_URL}/api/orders", []),
            fetch_json(client, f"{INVENTORY_API_URL}/api/inventory", []),
            fetch_json(client, f"{INVENTORY_API_URL}/api/inventory/order-reservations", []),
            fetch_json(client, f"{ACCOUNTING_API_URL}/api/v1/invoices?limit=5&offset=0", {"total": 0, "items": []}),
            fetch_json(client, f"{CRM_API_URL}/api/crm/purchases", []),
        )

    recent_order = orders[-1] if orders else None
    recent_reservation = reservations[0] if reservations else None
    recent_invoice = invoices["items"][0] if isinstance(invoices, dict) and invoices.get("items") else None
    recent_purchase = purchases[0] if purchases else None

    low_stock = [
        item
        for item in inventory
        if isinstance(item, dict) and int(item.get("stock", 0)) <= 10
    ]

    return {
        "status": "ok",
        "counts": {
            "orders": len(orders),
            "inventory_products": len(inventory),
            "inventory_reservations": len(reservations),
            "invoices": invoices.get("total", 0) if isinstance(invoices, dict) else 0,
            "crm_purchases": len(purchases),
        },
        "latest": {
            "order": recent_order,
            "inventory_reservation": recent_reservation,
            "invoice": recent_invoice,
            "purchase_history": recent_purchase,
        },
        "inventory": {
            "low_stock_items": low_stock,
        },
    }


@app.api_route("/api/orders", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.api_route("/api/orders/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_orders(request: Request, path: str = ""):
    return await proxy_request(request, _join_target(ORDER_API_URL, "/api/orders", path))


@app.api_route("/api/inventory", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.api_route("/api/inventory/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_inventory(request: Request, path: str = ""):
    return await proxy_request(request, _join_target(INVENTORY_API_URL, "/api/inventory", path))


@app.api_route("/api/accounting", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.api_route("/api/accounting/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_accounting(request: Request, path: str = ""):
    return await proxy_request(request, _join_target(ACCOUNTING_API_URL, "/api/v1", path))


@app.api_route("/api/crm", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.api_route("/api/crm/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_crm(request: Request, path: str = ""):
    return await proxy_request(request, _join_target(CRM_API_URL, "/api/crm", path))
