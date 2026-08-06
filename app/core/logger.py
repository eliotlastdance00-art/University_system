"""
Structured JSON logging for the University System.

Produces one JSON object per log line, compatible with
Grafana Loki / Promtail ingestion.  Fields:
  timestamp, level, service, domain, logger, message,
  request_id (when available), extra context.

Usage:
    from app.core.logger import get_domain_logger
    logger = get_domain_logger("auth")
    logger.info("user logged in", extra={"user_id": 42})
"""

import json
import logging
import sys
import traceback
from datetime import datetime, timezone

SERVICE_NAME = "university_system"


class StructuredJsonFormatter(logging.Formatter):
    """Formats each LogRecord as a single JSON line."""

    def format(self, record: logging.LogRecord) -> str:
        log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": SERVICE_NAME,
            "domain": getattr(record, "domain", "global"),
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Request-scoped fields injected via LoggerAdapter.extra
        for key in ("request_id", "user_id", "method", "path", "ip_address"):
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


def _build_base_logger(name: str) -> logging.Logger:
    """Create and configure a base logger."""
    log = logging.getLogger(name)
    log.setLevel(logging.DEBUG)
    log.propagate = False

    # Remove any pre-existing handlers
    for h in log.handlers[:]:
        log.removeHandler(h)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredJsonFormatter())
    log.addHandler(handler)
    return log


class DomainLogger(logging.LoggerAdapter):
    """
    Adapter that injects domain-scoped context into every log call.
    """
    def __init__(self, base_logger, domain: str, **kwargs):
        kwargs["domain"] = domain
        super().__init__(base_logger, kwargs)

    def process(self, msg, kwargs):
        extra = kwargs.get("extra", {})
        extra.update(self.extra)
        kwargs["extra"] = extra
        return msg, kwargs


def get_domain_logger(domain: str) -> DomainLogger:
    """
    Factory function to get a logger for a specific domain.
    """
    base_logger = _build_base_logger(f"app.{domain}")
    return DomainLogger(base_logger, domain=domain)


# For backward compatibility or global usage
logger = _build_base_logger("app")


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
        extra = kwargs.get("extra", {})
        extra.update(self.extra)
        kwargs["extra"] = extra
        return msg, kwargs
