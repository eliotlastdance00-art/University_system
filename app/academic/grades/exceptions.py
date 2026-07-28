"""
Grades domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError   →  GradeNotFoundError
  ├── ValidationError →  InvalidGradeValueError
  └── ForbiddenError  →  UnauthorizedGradeAccessError
"""

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError


class GradeNotFoundError(NotFoundError):
    """Raised when a grade with the given ID does not exist."""

    error_code = "GRADE_NOT_FOUND"

    def __init__(self, message: str = "Grade not found"):
        super().__init__(message)


class InvalidGradeValueError(ValidationError):
    """Raised when score is outside the valid range (0 … max_score)."""

    error_code = "INVALID_GRADE_VALUE"

    def __init__(self, message: str = "Invalid grade value"):
        super().__init__(message)


class UnauthorizedGradeAccessError(ForbiddenError):
    """Raised when a user tries to access a grade they don't own."""

    error_code = "UNAUTHORIZED_GRADE_ACCESS"

    def __init__(
        self, message: str = "You do not have permission to access this grade"
    ):
        super().__init__(message)
