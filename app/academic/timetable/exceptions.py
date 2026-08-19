"""
Timetable domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError   →  TimetableNotFoundError
  │                   →  RoomNotFoundError
  │                   →  TimeSlotNotFoundError
  ├── ValidationError →  InvalidTimeRangeError
  │                   →  NoSlotsAvailableError
  │                   →  InsufficientRoomCapacityError
  └── ConflictError
      ├── TimetableConflictError      (duplicate slot)
      ├── TeacherScheduleConflictError (teacher double-booked)
      ├── RoomConflictError            (room double-booked)
      └── SectionConflictError         (section double-booked)
"""

from app.core.exceptions import ConflictError, NotFoundError, ValidationError


class TimetableNotFoundError(NotFoundError):
    """Raised when a timetable entry with the given ID does not exist."""

    error_code = "TIMETABLE_NOT_FOUND"

    def __init__(self, message: str = "Timetable entry not found"):
        super().__init__(message)


class RoomNotFoundError(NotFoundError):
    """Raised when a room with the given ID does not exist."""

    error_code = "ROOM_NOT_FOUND"

    def __init__(self, message: str = "Room not found"):
        super().__init__(message)


class TimeSlotNotFoundError(NotFoundError):
    """Raised when the requested time slot does not exist."""

    error_code = "TIME_SLOT_NOT_FOUND"

    def __init__(self, message: str = "Time slot not found"):
        super().__init__(message)


class InvalidTimeRangeError(ValidationError):
    """Raised when start_time is not strictly before end_time."""

    error_code = "INVALID_TIME_RANGE"

    def __init__(self, message: str = "Start time must be before end time"):
        super().__init__(message)


class NoSlotsAvailableError(ValidationError):
    """Raised when the generator cannot find any available slot for an assignment."""

    error_code = "NO_SLOTS_AVAILABLE"

    def __init__(self, message: str = "No available slots for this assignment"):
        super().__init__(message)


class InsufficientRoomCapacityError(ValidationError):
    """Raised when no room has enough capacity for the student count."""

    error_code = "INSUFFICIENT_ROOM_CAPACITY"

    def __init__(self, message: str = "No room with sufficient capacity"):
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


class RoomConflictError(ConflictError):
    """Raised when a room is already booked at the requested time."""

    error_code = "ROOM_CONFLICT"

    def __init__(self, message: str = "Room is already booked at this time"):
        super().__init__(message)


class SectionConflictError(ConflictError):
    """Raised when a section already has a class at the requested time."""

    error_code = "SECTION_CONFLICT"

    def __init__(self, message: str = "Section already has a class at this time"):
        super().__init__(message)
