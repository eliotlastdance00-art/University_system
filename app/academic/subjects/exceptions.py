"""
Subjects domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError  →  SubjectNotFoundError
  └── ConflictError  →  SubjectAlreadyExistsError
"""

from app.core.exceptions import ConflictError, NotFoundError


class SubjectNotFoundError(NotFoundError):
    """Raised when a subject with the given ID / name does not exist."""

    error_code = "SUBJECT_NOT_FOUND"

    def __init__(self, message: str = "Subject not found"):
        super().__init__(message)


class SubjectAlreadyExistsError(ConflictError):
    """
    Raised when creating a subject whose name already exists
    in the same department.
    """

    error_code = "SUBJECT_ALREADY_EXISTS"

    def __init__(self, message: str = "Subject with this name already exists in this department"):
        super().__init__(message)
