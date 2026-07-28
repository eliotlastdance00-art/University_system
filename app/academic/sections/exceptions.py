"""
Sections domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError  →  SectionNotFoundError
  └── ConflictError  →  SectionCapacityExceededError
"""

from app.core.exceptions import ConflictError, NotFoundError


class SectionNotFoundError(NotFoundError):
    """Raised when a section with the given ID does not exist."""

    error_code = "SECTION_NOT_FOUND"

    def __init__(self, message: str = "Section not found"):
        super().__init__(message)


class SectionCapacityExceededError(ConflictError):
    """Raised when the section has reached its maximum student capacity."""

    error_code = "SECTION_CAPACITY_EXCEEDED"

    def __init__(self, message: str = "Section is at full capacity"):
        super().__init__(message)
