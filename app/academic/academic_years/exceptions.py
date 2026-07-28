"""
Academic Years domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError   →  AcademicYearNotFoundError
  └── ValidationError →  InvalidAcademicYearRangeError
"""

from app.core.exceptions import NotFoundError, ValidationError


class AcademicYearNotFoundError(NotFoundError):
    """Raised when an academic year with the given ID does not exist."""

    error_code = "ACADEMIC_YEAR_NOT_FOUND"

    def __init__(self, message: str = "Academic year not found"):
        super().__init__(message)


class InvalidAcademicYearRangeError(ValidationError):
    """Raised when year_start is not strictly less than year_end."""

    error_code = "INVALID_ACADEMIC_YEAR_RANGE"

    def __init__(
        self, message: str = "year_start must be less than year_end"
    ):
        super().__init__(message)
