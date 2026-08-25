"""
Attendance domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError    →  AttendanceNotFoundError
  │                    →  AttendanceRecordsNotFoundError
  │                    →  QrSessionNotFoundError
  ├── ForbiddenError   →  NotLessonOwnerError
  │                    →  QrNotEnrolledError
  ├── ConflictError    →  QrSessionAlreadyActiveError
  │                    →  QrAlreadyScannedError
  └── ValidationError  →  QrSessionClosedError
                       →  QrTokenExpiredError
                       →  QrTokenInvalidError
"""

from app.core.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
)


class AttendanceNotFoundError(NotFoundError):
    """Raised when a single attendance record with the given ID does not exist."""

    error_code = "ATTENDANCE_NOT_FOUND"

    def __init__(self, message: str = "Attendance record not found"):
        super().__init__(message)


class AttendanceRecordsNotFoundError(NotFoundError):
    """
    Raised when a query (by lesson / student / section) returns no records.
    Distinct from AttendanceNotFoundError — this is a collection query.
    """

    error_code = "ATTENDANCE_RECORDS_NOT_FOUND"

    def __init__(self, message: str = "No attendance records found"):
        super().__init__(message)


class NotLessonOwnerError(ForbiddenError):
    """Raised when a teacher tries to manage attendance for a lesson they don't own."""

    error_code = "NOT_LESSON_OWNER"

    def __init__(self, message: str = "You are not the owner of this lesson"):
        super().__init__(message)


# ─── QR Session Exceptions ──────────────────────────────────


class QrSessionNotFoundError(NotFoundError):
    """Raised when the requested QR session does not exist."""

    error_code = "QR_SESSION_NOT_FOUND"

    def __init__(self, message: str = "QR session not found"):
        super().__init__(message)


class QrSessionAlreadyActiveError(ConflictError):
    """Raised when trying to open a second QR session for a lesson that already has one."""

    error_code = "QR_SESSION_ALREADY_ACTIVE"

    def __init__(self, message: str = "This lesson already has an active QR session"):
        super().__init__(message)


class QrSessionClosedError(ValidationError):
    """Raised when trying to interact with a closed session."""

    error_code = "QR_SESSION_CLOSED"

    def __init__(self, message: str = "This QR session has been closed"):
        super().__init__(message)


class QrTokenExpiredError(ValidationError):
    """Raised when the submitted token has expired (30s window passed)."""

    error_code = "QR_TOKEN_EXPIRED"

    def __init__(self, message: str = "QR token has expired, please scan the new code"):
        super().__init__(message)


class QrTokenInvalidError(ValidationError):
    """Raised when the submitted token does not match the current active token."""

    error_code = "QR_TOKEN_INVALID"

    def __init__(self, message: str = "Invalid QR token"):
        super().__init__(message)


class QrAlreadyScannedError(ConflictError):
    """Raised when a student tries to scan twice in the same session."""

    error_code = "QR_ALREADY_SCANNED"

    def __init__(self, message: str = "You have already been marked present in this session"):
        super().__init__(message)


class QrNotEnrolledError(ForbiddenError):
    """Raised when a student is not enrolled in the lesson's section."""

    error_code = "QR_NOT_ENROLLED"

    def __init__(self, message: str = "You are not enrolled in this lesson's section"):
        super().__init__(message)
