from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone

import models
from config import get_settings
from database import SessionLocal
from rabbitmq import publish_event
from sqlalchemy.exc import OperationalError, ProgrammingError


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


def _retry_backoff_seconds(attempt_count: int) -> int:
    multiplier = max(1, 2 ** max(attempt_count - 1, 0))
    return settings.outbox_poll_interval_seconds * multiplier


def process_pending_events() -> int:
    processed = 0

    with SessionLocal() as db:
        events = (
            db.query(models.OutboxEvent)
            .filter(
                models.OutboxEvent.status == "pending",
                models.OutboxEvent.attempt_count < settings.outbox_max_attempts,
            )
            .order_by(models.OutboxEvent.created_at.asc(), models.OutboxEvent.id.asc())
            .limit(settings.outbox_batch_size)
            .all()
        )

        for event in events:
            processed += 1
            try:
                payload = json.loads(event.payload)
                if not isinstance(payload, dict):
                    raise ValueError("Stored outbox payload is not a JSON object.")

                publish_event(payload, routing_key=settings.rabbitmq_routing_key, message_type=event.event_type)
                event.attempt_count += 1
                event.status = "published"
                event.last_error = None
                event.published_at = datetime.now(timezone.utc)
                db.commit()
                logger.info("Published outbox event %s for %s #%s", event.id, event.aggregate_type, event.aggregate_id)
            except Exception as exc:  # noqa: BLE001 - publisher should keep retrying and surface state in DB
                event.attempt_count += 1
                event.last_error = (str(exc) or repr(exc))[:1000]
                event.status = "failed" if event.attempt_count >= settings.outbox_max_attempts else "pending"
                db.commit()
                backoff_seconds = _retry_backoff_seconds(event.attempt_count)
                logger.warning(
                    "Failed to publish outbox event %s (attempt %s/%s). Retrying in %ss: %s",
                    event.id,
                    event.attempt_count,
                    settings.outbox_max_attempts,
                    backoff_seconds,
                    exc,
                )
                if event.status != "failed":
                    time.sleep(backoff_seconds)

    return processed


def start() -> None:
    logger.info(
        "Starting order outbox publisher with poll interval=%ss max_attempts=%s batch_size=%s",
        settings.outbox_poll_interval_seconds,
        settings.outbox_max_attempts,
        settings.outbox_batch_size,
    )

    while True:
        try:
            processed = process_pending_events()
        except (OperationalError, ProgrammingError) as exc:
            logger.info("Outbox schema is not ready yet: %s", exc)
            processed = 0
        except Exception as exc:  # noqa: BLE001 - publisher should stay alive and keep retrying
            logger.exception("Unexpected outbox publisher failure: %s", exc)
            processed = 0

        if processed == 0:
            time.sleep(settings.outbox_poll_interval_seconds)


if __name__ == "__main__":
    start()
