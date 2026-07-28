"""
Profile domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError  →  ProfileNotFoundError
  └── ConflictError  →  EmailAlreadyInUseError
"""

from app.core.exceptions import ConflictError, NotFoundError


class ProfileNotFoundError(NotFoundError):
    """Raised when a user profile with the given ID does not exist."""

    error_code = "PROFILE_NOT_FOUND"

    def __init__(self, message: str = "Profile not found"):
        super().__init__(message)


class EmailAlreadyInUseError(ConflictError):
    """Raised when updating a profile email to one already taken by another user."""

    error_code = "EMAIL_ALREADY_IN_USE"

    def __init__(self, message: str = "Email is already in use by another account"):
        super().__init__(message)
