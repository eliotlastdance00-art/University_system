"""
Faculty domain exceptions.

Hierarchy:
    AppError
    ├── NotFoundError  →  FacultyNotFoundError
    ├── ConflictError  →  FacultyAlreadyExistsError
    └── ValidationError → FacultyCreateError
"""

from app.core.exceptions import ConflictError, NotFoundError, ValidationError


class FacultyNotFoundError(NotFoundError):
    """Raised when a faculty with the given ID / code does not exist."""

    error_code = "FACULTY_NOT_FOUND"

    def __init__(self, message: str = "Faculty not found"):
        super().__init__(message)


class FacultyAlreadyExistsError(ConflictError):
    """Raised when creating a faculty with a code that already exists."""

    error_code = "FACULTY_ALREADY_EXISTS"

    def __init__(self, message: str = "Faculty with this code already exists"):
        super().__init__(message)


class FacultyCreateError(ValidationError):
    """Raised when the faculty record was not persisted after creation."""

    error_code = "FACULTY_CREATE_FAILED"

    def __init__(self, message: str = "Failed to create faculty"):
        super().__init__(message)
