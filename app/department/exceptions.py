"""
Department domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError  →  DepartmentNotFoundError
  └── ConflictError  →  DepartmentAlreadyExistsError
"""

from app.core.exceptions import ConflictError, NotFoundError


class DepartmentNotFoundError(NotFoundError):
    """Raised when a department with the given ID / name does not exist."""

    error_code = "DEPARTMENT_NOT_FOUND"

    def __init__(self, message: str = "Department not found"):
        super().__init__(message)


class DepartmentAlreadyExistsError(ConflictError):
    """Raised when creating a department whose name already exists."""

    error_code = "DEPARTMENT_ALREADY_EXISTS"

    def __init__(self, message: str = "Department with this name already exists"):
        super().__init__(message)
