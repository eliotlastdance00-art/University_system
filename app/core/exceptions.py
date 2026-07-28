"""
Core exception hierarchy — base classes only.

Domain-specific exceptions live in their own domain folder:
  app/users/exceptions.py
  app/auth/exceptions.py
  app/faculty/exceptions.py
  app/department/exceptions.py
  app/academic/grades/exceptions.py
  app/academic/sections/exceptions.py
  ... etc.

Every custom exception inherits from AppError, which carries:
  - message:     human-readable explanation
  - status_code: HTTP status to return
  - error_code:  machine-readable string for clients

The global handler in main.py converts AppError → consistent JSON.
"""


class AppError(Exception):
    """Root base for every application-level error."""

    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str = "An unexpected error occurred"):
        self.message = message
        super().__init__(self.message)


# ─── 400 Bad Request ────────────────────────────────────────


class ValidationError(AppError):
    """Generic input / business-rule validation failure."""

    status_code = 400
    error_code = "VALIDATION_ERROR"

    def __init__(self, message: str = "Validation failed"):
        super().__init__(message)


# ─── 401 Unauthorized ───────────────────────────────────────


class UnauthorizedError(AppError):
    """Missing or invalid authentication credentials."""

    status_code = 401
    error_code = "UNAUTHORIZED"

    def __init__(self, message: str = "Authentication required"):
        super().__init__(message)


# ─── 403 Forbidden ──────────────────────────────────────────


class ForbiddenError(AppError):
    """Authenticated but not permitted to perform the action."""

    status_code = 403
    error_code = "FORBIDDEN"

    def __init__(self, message: str = "Access denied"):
        super().__init__(message)


# ─── 404 Not Found ──────────────────────────────────────────


class NotFoundError(AppError):
    """Requested resource does not exist."""

    status_code = 404
    error_code = "NOT_FOUND"

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message)


# ─── 409 Conflict ───────────────────────────────────────────


class ConflictError(AppError):
    """Resource already exists or state conflict."""

    status_code = 409
    error_code = "CONFLICT"

    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message)


# ─── 429 Rate Limit ─────────────────────────────────────────


class RateLimitError(AppError):
    """Client is sending too many requests."""

    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"

    def __init__(self, message: str = "Too many requests"):
        super().__init__(message)
