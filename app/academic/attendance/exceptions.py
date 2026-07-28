"""
Attendance domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError  →  AttendanceNotFoundError
  │                 →  AttendanceRecordsNotFoundError
  └── ForbiddenError →  NotLessonOwnerError
"""

from app.core.exceptions import ForbiddenError, NotFoundError


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
