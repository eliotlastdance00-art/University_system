"""
Assignments domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError  →  AssignmentNotFoundError
  └── ConflictError  →  AssignmentAlreadyExistsError
                    →  AssignmentDeleteError  (AppError 500)
"""

from app.core.exceptions import AppError, ConflictError, NotFoundError


class AssignmentNotFoundError(NotFoundError):
    """Raised when an assignment with the given ID does not exist."""

    error_code = "ASSIGNMENT_NOT_FOUND"

    def __init__(self, message: str = "Assignment not found"):
        super().__init__(message)


class AssignmentAlreadyExistsError(ConflictError):
    """
    Raised when a teacher is already assigned to the same subject /
    section / semester combination.
    """

    error_code = "ASSIGNMENT_ALREADY_EXISTS"

    def __init__(
        self,
        message: str = (
            "This teacher has already been assigned to this subject "
            "for this group in this semester."
        ),
    ):
        super().__init__(message)


class AssignmentDeleteError(AppError):
    """Raised when the delete operation fails unexpectedly."""

    status_code = 500
    error_code = "ASSIGNMENT_DELETE_FAILED"

    def __init__(self, message: str = "Failed to delete the assignment"):
        super().__init__(message)
