"""
Cohorts domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError  →  CohortNotFoundError
  └── ConflictError  →  CohortAlreadyExistsError
"""

from app.core.exceptions import ConflictError, NotFoundError


class CohortNotFoundError(NotFoundError):
    """Raised when a cohort with the given ID does not exist."""

    error_code = "COHORT_NOT_FOUND"

    def __init__(self, message: str = "Cohort not found"):
        super().__init__(message)


class CohortAlreadyExistsError(ConflictError):
    """
    Raised when a cohort already exists for the given
    program_id + academic_year_id combination.
    """

    error_code = "COHORT_ALREADY_EXISTS"

    def __init__(
        self,
        message: str = "Cohort already exists for this program and academic year",
    ):
        super().__init__(message)
