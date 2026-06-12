from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware


def _load_nearest_env() -> None:
    for directory in (Path(__file__).resolve().parent, *Path(__file__).resolve().parents):
        env_path = directory / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            return
    load_dotenv()


_load_nearest_env()


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _csv_env(name: str) -> list[str]:
    raw = _required_env(name)
    return [item.strip() for item in raw.split(",") if item.strip()]


ORDER_API_URL = _required_env("ORDER_API_URL")
INVENTORY_API_URL = _required_env("INVENTORY_API_URL")
ACCOUNTING_API_URL = _required_env("ACCOUNTING_API_URL")
CRM_API_URL = _required_env("CRM_API_URL")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "15"))
CORS_ALLOW_ORIGINS = _csv_env("GATEWAY_CORS_ORIGINS")
RABBITMQ_MANAGEMENT_URL = _required_env("RABBITMQ_MANAGEMENT_URL")
RABBITMQ_MANAGEMENT_USER = _required_env("RABBITMQ_MANAGEMENT_USER")
RABBITMQ_MANAGEMENT_PASSWORD = _required_env("RABBITMQ_MANAGEMENT_PASSWORD")
RABBITMQ_MANAGEMENT_CONSOLE_URL = os.getenv("RABBITMQ_MANAGEMENT_CONSOLE_URL", "").strip()
OBSERVED_RABBITMQ_QUEUES = _csv_env("OBSERVED_RABBITMQ_QUEUES")

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
    version="1.1.0",
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


async def fetch_json(client: httpx.AsyncClient, url: str, default: Any, **kwargs: Any) -> Any:
    try:
        response = await client.get(url, **kwargs)
        response.raise_for_status()
        return response.json()
    except Exception:
        return default


def _join_target(base_url: str, service_prefix: str, path: str) -> str:
    suffix = f"/{path}" if path else ""
    return f"{base_url}{service_prefix}{suffix}"


def _extract_latest_invoice(invoices: Any) -> dict[str, Any] | None:
    if isinstance(invoices, dict) and invoices.get("items"):
        first_item = invoices["items"][0]
        return first_item if isinstance(first_item, dict) else None
    return None


def _compute_low_stock_items(inventory: Any) -> list[dict[str, Any]]:
    if not isinstance(inventory, list):
        return []

    return [
        item
        for item in inventory
        if isinstance(item, dict) and int(item.get("stock", 0)) <= 10
    ]


def _build_business_snapshot(
    orders: Any,
    inventory: Any,
    reservations: Any,
    invoices: Any,
    purchases: Any,
) -> dict[str, Any]:
    recent_order = orders[-1] if isinstance(orders, list) and orders else None
    recent_reservation = reservations[0] if isinstance(reservations, list) and reservations else None
    recent_invoice = _extract_latest_invoice(invoices)
    recent_purchase = purchases[0] if isinstance(purchases, list) and purchases else None
    low_stock = _compute_low_stock_items(inventory)

    return {
        "status": "ok",
        "counts": {
            "orders": len(orders) if isinstance(orders, list) else 0,
            "inventory_products": len(inventory) if isinstance(inventory, list) else 0,
            "inventory_reservations": len(reservations) if isinstance(reservations, list) else 0,
            "invoices": invoices.get("total", 0) if isinstance(invoices, dict) else 0,
            "crm_purchases": len(purchases) if isinstance(purchases, list) else 0,
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


async def load_business_snapshot(client: httpx.AsyncClient) -> dict[str, Any]:
    orders, inventory, reservations, invoices, purchases = await asyncio.gather(
        fetch_json(client, f"{ORDER_API_URL}/api/orders", []),
        fetch_json(client, f"{INVENTORY_API_URL}/api/inventory", []),
        fetch_json(client, f"{INVENTORY_API_URL}/api/inventory/order-reservations", []),
        fetch_json(client, f"{ACCOUNTING_API_URL}/api/v1/invoices?limit=5&offset=0", {"total": 0, "items": []}),
        fetch_json(client, f"{CRM_API_URL}/api/crm/purchases", []),
    )

    return _build_business_snapshot(orders, inventory, reservations, invoices, purchases)


async def load_downstream_sync(client: httpx.AsyncClient, latest_order: dict[str, Any] | None) -> dict[str, Any]:
    if not isinstance(latest_order, dict):
        idle = {"status": "idle", "expected_order_id": None, "observed_order_id": None}
        return {
            "inventory": idle,
            "accounting": idle,
            "crm": idle,
        }

    order_id = str(latest_order.get("id") or latest_order.get("order_id") or "").strip()
    if not order_id:
        missing = {"status": "missing", "expected_order_id": None, "observed_order_id": None}
        return {
            "inventory": missing,
            "accounting": missing,
            "crm": missing,
        }

    reservation, invoice, purchase = await asyncio.gather(
        fetch_json(client, f"{INVENTORY_API_URL}/api/inventory/order-reservations/{order_id}", None),
        fetch_json(client, f"{ACCOUNTING_API_URL}/api/v1/invoices/by-order/{order_id}", None),
        fetch_json(client, f"{CRM_API_URL}/api/crm/purchases/order/{order_id}", None),
    )

    return {
        "inventory": _sync_status(latest_order, reservation),
        "accounting": _sync_status(latest_order, invoice),
        "crm": _sync_status(latest_order, purchase),
    }


async def load_service_health(client: httpx.AsyncClient) -> dict[str, Any]:
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


def _sync_status(expected_order: dict[str, Any] | None, candidate: dict[str, Any] | None) -> dict[str, Any]:
    if not isinstance(expected_order, dict):
        return {"status": "idle", "expected_order_id": None, "observed_order_id": None}

    expected_id = str(expected_order.get("id") or expected_order.get("order_id") or "")
    candidate_id = None
    if isinstance(candidate, dict) and candidate.get("order_id") is not None:
        candidate_id = str(candidate.get("order_id"))

    if candidate_id == expected_id:
        status = "synced"
    elif candidate_id is None:
        status = "missing"
    else:
        status = "lagging"

    return {
        "status": status,
        "expected_order_id": expected_id,
        "observed_order_id": candidate_id,
    }


async def load_rabbitmq_observability(client: httpx.AsyncClient) -> dict[str, Any]:
    default_payload = {
        "status": "unavailable",
        "console_url": RABBITMQ_MANAGEMENT_CONSOLE_URL or None,
        "queues": [
            {
                "name": queue_name,
                "state": "unavailable",
                "messages": 0,
                "messages_ready": 0,
                "messages_unacknowledged": 0,
                "consumers": 0,
            }
            for queue_name in OBSERVED_RABBITMQ_QUEUES
        ],
    }

    queues = await fetch_json(
        client,
        f"{RABBITMQ_MANAGEMENT_URL.rstrip('/')}/queues/%2F",
        default_payload,
        auth=(RABBITMQ_MANAGEMENT_USER, RABBITMQ_MANAGEMENT_PASSWORD),
    )

    if not isinstance(queues, list):
        return default_payload

    queue_map = {queue.get("name"): queue for queue in queues if isinstance(queue, dict)}
    observed = []
    for queue_name in OBSERVED_RABBITMQ_QUEUES:
        queue = queue_map.get(queue_name, {})
        observed.append(
            {
                "name": queue_name,
                "state": queue.get("state", "missing"),
                "messages": int(queue.get("messages", 0) or 0),
                "messages_ready": int(queue.get("messages_ready", 0) or 0),
                "messages_unacknowledged": int(queue.get("messages_unacknowledged", 0) or 0),
                "consumers": int(queue.get("consumers", 0) or 0),
            }
        )

    return {
        "status": "ok",
        "console_url": RABBITMQ_MANAGEMENT_CONSOLE_URL or None,
        "queues": observed,
    }


def _empty_outbox_payload() -> dict[str, Any]:
    return {
        "summary": {
            "total": 0,
            "pending": 0,
            "published": 0,
            "failed": 0,
        },
        "items": [],
    }


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
            "/api/admin/observability",
        ],
    }


@app.get("/health")
async def health():
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        return await load_service_health(client)


@app.get("/api/admin/integration-overview")
async def integration_overview():
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        return await load_business_snapshot(client)


@app.get("/api/admin/observability")
async def observability():
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        health_payload, business_snapshot, outbox_payload, rabbitmq_payload = await asyncio.gather(
            load_service_health(client),
            load_business_snapshot(client),
            fetch_json(client, f"{ORDER_API_URL}/api/orders/outbox?limit=10", _empty_outbox_payload()),
            load_rabbitmq_observability(client),
        )
        latest_order = business_snapshot.get("latest", {}).get("order")
        downstream_sync = await load_downstream_sync(client, latest_order)

    latest = business_snapshot.get("latest", {})
    latest_order = latest.get("order")

    return {
        "status": "ok",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "services": health_payload.get("services", {}),
        "business_snapshot": business_snapshot,
        "outbox": outbox_payload,
        "messaging": rabbitmq_payload,
        "latest_integration": {
            "order": latest_order,
            "downstream": downstream_sync,
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
