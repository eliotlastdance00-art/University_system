"""
Structured JSON logging for the University System.

Produces one JSON object per log line, compatible with
Grafana Loki / Promtail ingestion.  Fields:
  timestamp, level, service, logger, message,
  request_id (when available), extra context.

Usage:
    from app.core.logger import logger
    logger.info("grade created", extra={"grade_id": 42})
"""

import json
import logging
import sys
import traceback
from datetime import datetime, timezone

SERVICE_NAME = "university_system"


class StructuredJsonFormatter(logging.Formatter):
    """Formats each LogRecord as a single JSON line."""

    def format(self, record: logging.Formatter) -> str:
        log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": SERVICE_NAME,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Request-scoped fields injected via LoggerAdapter.extra
        for key in ("request_id", "user_id", "method", "path"):
            val = getattr(record, key, None)
            if val is not None:
                log[key] = val

        # Arbitrary context passed via extra={"context": {...}}
        ctx = getattr(record, "context", None)
        if ctx:
            log["context"] = ctx

        # Exception info
        if record.exc_info and record.exc_info[0] is not None:
            log["exception"] = "".join(traceback.format_exception(*record.exc_info))

        return json.dumps(log, default=str)


def _build_logger() -> logging.Logger:
    """Create and configure the application-wide logger."""
    log = logging.getLogger("app")
    log.setLevel(logging.DEBUG)
    log.propagate = False

    # Remove any pre-existing handlers (e.g. from reloads)
    for h in log.handlers[:]:
        log.removeHandler(h)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredJsonFormatter())
    log.addHandler(handler)
    return log


logger = _build_logger()


class RequestLogger(logging.LoggerAdapter):
    """
    Adapter that injects request-scoped context into every log call.

    Usage inside middleware:
        req_logger = RequestLogger(logger, request_id=..., method=..., path=...)
        req_logger.info("handling request")
    """

    def __init__(self, base_logger, **kwargs):
        super().__init__(base_logger, kwargs)

    def process(self, msg, kwargs):
        # Merge our extras into the LogRecord
        extra = kwargs.get("extra", {})
        extra.update(self.extra)
        kwargs["extra"] = extra
        return msg, kwargs
