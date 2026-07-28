"""
HTTP middleware for the University System.

RequestContextMiddleware:
  - Assigns a UUID request_id to every incoming request
  - Logs the request start + response finish (with status + latency)
  - Catches unhandled exceptions, logs them, and returns a safe 500

Place this BEFORE exception handlers in main.py so it wraps everything.
"""

import time
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logger import RequestLogger, logger


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Injects request_id, logs request/response, catches unhandled errors."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())

        # Store on request.state so downstream code can access it
        request.state.request_id = request_id

        req_logger = RequestLogger(
            logger,
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        req_logger.info("request_started")
        start = time.perf_counter()

        try:
            response = await call_next(request)
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

            req_logger.info(
                "request_completed",
                extra={
                    "context": {
                        "status_code": response.status_code,
                        "elapsed_ms": elapsed_ms,
                    }
                },
            )

            # Propagate request_id to the client via header
            response.headers["X-Request-ID"] = request_id
            return response

        except Exception:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            req_logger.exception(
                "unhandled_exception",
                extra={"context": {"elapsed_ms": elapsed_ms}},
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error_code": "INTERNAL_ERROR",
                    "detail": "An unexpected error occurred. Please try again later.",
                    "request_id": request_id,
                },
            )
