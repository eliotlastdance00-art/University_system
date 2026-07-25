"""
Centralized exception hierarchy for the University System.

All custom exceptions inherit from AppError, which carries:
 - message:     human-readable explanation
 - status_code: HTTP status to return
 - error_code:  machine-readable string for clients

Modules should raise these instead of raw HTTPException
so the global handler in main.py can produce consistent
JSON error responses.
"""


class AppError(Exception):
    """Base exception for all application errors."""

    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str = "An unexpected error occurred"):
        self.message = message
        super().__init__(self.message)


# ─── 400 Bad Request ────────────────────────────────────────


class ValidationError(AppError):
    status_code = 400
    error_code = "VALIDATION_ERROR"

    def __init__(self, message: str = "Validation failed"):
        super().__init__(message)


class InvalidGradeValueError(ValidationError):
    error_code = "INVALID_GRADE_VALUE"

    def __init__(self, message: str = "Invalid grade value"):
        super().__init__(message)


# ─── 401 Unauthorized ──────────────────────────────────────


class UnauthorizedError(AppError):
    status_code = 401
    error_code = "UNAUTHORIZED"

    def __init__(self, message: str = "Authentication required"):
        super().__init__(message)


# ─── 403 Forbidden ──────────────────────────────────────────


class ForbiddenError(AppError):
    status_code = 403
    error_code = "FORBIDDEN"

    def __init__(self, message: str = "Access denied"):
        super().__init__(message)


class UnauthorizedGradeAccessError(ForbiddenError):
    error_code = "UNAUTHORIZED_GRADE_ACCESS"

    def __init__(
        self, message: str = "You do not have permission to access this grade"
    ):
        super().__init__(message)


# ─── 404 Not Found ──────────────────────────────────────────


class NotFoundError(AppError):
    status_code = 404
    error_code = "NOT_FOUND"

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message)


class GradeNotFoundError(NotFoundError):
    error_code = "GRADE_NOT_FOUND"

    def __init__(self, message: str = "Grade not found"):
        super().__init__(message)


# ─── 409 Conflict ───────────────────────────────────────────


class ConflictError(AppError):
    status_code = 409
    error_code = "CONFLICT"

    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message)


# ─── 429 Rate Limit ─────────────────────────────────────────


class RateLimitError(AppError):
    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"

    def __init__(self, message: str = "Too many requests"):
        super().__init__(message)
