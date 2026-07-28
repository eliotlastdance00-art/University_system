"""
Programs domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError  →  ProgramNotFoundError
  └── ConflictError  →  ProgramAlreadyExistsError
"""

from app.core.exceptions import ConflictError, NotFoundError


class ProgramNotFoundError(NotFoundError):
    """Raised when an academic program with the given ID / name does not exist."""

    error_code = "PROGRAM_NOT_FOUND"

    def __init__(self, message: str = "Program not found"):
        super().__init__(message)


class ProgramAlreadyExistsError(ConflictError):
    """Raised when creating a program whose name already exists."""

    error_code = "PROGRAM_ALREADY_EXISTS"

    def __init__(self, message: str = "Program with this name already exists"):
        super().__init__(message)
