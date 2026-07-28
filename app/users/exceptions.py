"""
Users domain exceptions.

Hierarchy:
  AppError
  ├── NotFoundError  →  UserNotFoundError
  ├── ConflictError  →  UserAlreadyExistsError
  ├── ValidationError
  │   ├── WeakPasswordError
  │   └── InvalidRoleAssignmentError
  └── ForbiddenError →  RoleAlreadyAssignedError (409 mantığıyla aynı ama domain anlamı farklı)
"""

from app.core.exceptions import ConflictError, NotFoundError, ValidationError


class UserNotFoundError(NotFoundError):
    """Raised when a user with the given ID / email does not exist."""

    error_code = "USER_NOT_FOUND"

    def __init__(self, message: str = "User not found"):
        super().__init__(message)


class UserAlreadyExistsError(ConflictError):
    """Raised when registering with an e-mail that is already taken."""

    error_code = "USER_ALREADY_EXISTS"

    def __init__(self, message: str = "A user with this email already exists"):
        super().__init__(message)


class WeakPasswordError(ValidationError):
    """Raised when the supplied password does not meet security requirements."""

    error_code = "WEAK_PASSWORD"

    def __init__(
        self, message: str = "Password must be at least 8 characters long"
    ):
        super().__init__(message)


class RoleNotFoundError(NotFoundError):
    """Raised when the requested role ID does not exist."""

    error_code = "ROLE_NOT_FOUND"

    def __init__(self, message: str = "Role not found"):
        super().__init__(message)


class RoleAlreadyAssignedError(ConflictError):
    """Raised when the user already holds the role being assigned."""

    error_code = "ROLE_ALREADY_ASSIGNED"

    def __init__(self, message: str = "User already has this role"):
        super().__init__(message)


class RoleNotAssignedError(ValidationError):
    """Raised when trying to remove a role the user does not have."""

    error_code = "ROLE_NOT_ASSIGNED"

    def __init__(self, message: str = "User does not have this role"):
        super().__init__(message)


class SectionFullError(ConflictError):
    """Raised when the target section has reached its student capacity."""

    error_code = "SECTION_FULL"

    def __init__(self, message: str = "Section is full"):
        super().__init__(message)


class StudentRoleRequiredError(ValidationError):
    """Raised when trying to assign a section to a non-student user."""

    error_code = "STUDENT_ROLE_REQUIRED"

    def __init__(self, message: str = "This user is not a student"):
        super().__init__(message)
