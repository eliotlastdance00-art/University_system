"""
Lessons domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError  →  LessonNotFoundError
  ├── ConflictError
  │   ├── LessonAlreadyStartedError   (already started today)
  │   └── LessonAlreadyCancelledError
  └── ForbiddenError →  NotLessonTeacherError
"""

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError


class LessonNotFoundError(NotFoundError):
    """Raised when a lesson with the given ID does not exist."""

    error_code = "LESSON_NOT_FOUND"

    def __init__(self, message: str = "Lesson not found"):
        super().__init__(message)


class LessonAlreadyStartedError(ConflictError):
    """Raised when a lesson for this timetable has already been started today."""

    error_code = "LESSON_ALREADY_STARTED"

    def __init__(
        self,
        message: str = "This lesson has already been started today for this timetable",
    ):
        super().__init__(message)


class LessonAlreadyCancelledError(ConflictError):
    """Raised when trying to cancel a lesson that is already cancelled."""

    error_code = "LESSON_ALREADY_CANCELLED"

    def __init__(self, message: str = "This lesson has already been cancelled"):
        super().__init__(message)


class NotLessonTeacherError(ForbiddenError):
    """Raised when a user tries to start / cancel a lesson they don't own."""

    error_code = "NOT_LESSON_TEACHER"

    def __init__(self, message: str = "You are not the teacher of this lesson"):
        super().__init__(message)
