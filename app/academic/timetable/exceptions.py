"""
Timetable domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError   →  TimetableNotFoundError
  ├── ValidationError →  InvalidTimeRangeError
  └── ConflictError
      ├── TimetableConflictError      (duplicate slot)
      └── TeacherScheduleConflictError (teacher double-booked)
"""

from app.core.exceptions import ConflictError, NotFoundError, ValidationError


class TimetableNotFoundError(NotFoundError):
    """Raised when a timetable entry with the given ID does not exist."""

    error_code = "TIMETABLE_NOT_FOUND"

    def __init__(self, message: str = "Timetable entry not found"):
        super().__init__(message)


class InvalidTimeRangeError(ValidationError):
    """Raised when start_time is not strictly before end_time."""

    error_code = "INVALID_TIME_RANGE"

    def __init__(self, message: str = "Start time must be before end time"):
        super().__init__(message)


class TimetableConflictError(ConflictError):
    """
    Raised when the same assignment is already scheduled at the
    same day / start_time slot.
    """

    error_code = "TIMETABLE_CONFLICT"

    def __init__(
        self,
        message: str = "This assignment has already been assigned to this timetable slot",
    ):
        super().__init__(message)


class TeacherScheduleConflictError(ConflictError):
    """Raised when a teacher has a scheduling conflict at the requested time."""

    error_code = "TEACHER_SCHEDULE_CONFLICT"

    def __init__(
        self, message: str = "Teacher has a scheduling conflict at this time"
    ):
        super().__init__(message)
