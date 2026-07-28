"""
Auth domain exceptions.

Hierarchy:
  AppError
  ├── UnauthorizedError
  │   ├── InvalidCredentialsError
  │   ├── MissingOtpTokenError
  │   ├── InvalidOtpTokenError
  │   ├── OtpEmailMismatchError
  │   ├── InvalidOtpCodeError
  │   ├── InvalidRefreshTokenError
  │   ├── InvalidRefreshPayloadError
  │   ├── InvalidUserIdInTokenError
  │   ├── RefreshTokenNotFoundError
  │   └── TokenRevokedError
  └── ForbiddenError
      └── AccountInactiveError
"""

from app.core.exceptions import ForbiddenError, UnauthorizedError


class InvalidCredentialsError(UnauthorizedError):
    """Raised when email / password combination is wrong."""

    error_code = "INVALID_CREDENTIALS"

    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(message)


class AccountInactiveError(ForbiddenError):
    """Raised when the user account has been deactivated."""

    error_code = "ACCOUNT_INACTIVE"

    def __init__(self, message: str = "Account is inactive"):
        super().__init__(message)


class MissingOtpTokenError(UnauthorizedError):
    """Raised when the OTP cookie / token is absent from the request."""

    error_code = "MISSING_OTP_TOKEN"

    def __init__(self, message: str = "Missing OTP token"):
        super().__init__(message)


class InvalidOtpTokenError(UnauthorizedError):
    """Raised when the OTP JWT is expired or cannot be decoded."""

    error_code = "INVALID_OTP_TOKEN"

    def __init__(self, message: str = "OTP token expired or invalid"):
        super().__init__(message)


class OtpEmailMismatchError(UnauthorizedError):
    """Raised when the email in the OTP token does not match the request."""

    error_code = "OTP_EMAIL_MISMATCH"

    def __init__(self, message: str = "Email mismatch"):
        super().__init__(message)


class InvalidOtpCodeError(UnauthorizedError):
    """Raised when the submitted OTP code is wrong."""

    error_code = "INVALID_OTP_CODE"

    def __init__(self, message: str = "Invalid OTP code"):
        super().__init__(message)


class InvalidRefreshTokenError(UnauthorizedError):
    """Raised when the refresh token cannot be decoded or is structurally invalid."""

    error_code = "INVALID_REFRESH_TOKEN"

    def __init__(self, message: str = "Invalid refresh token"):
        super().__init__(message)


class InvalidRefreshPayloadError(UnauthorizedError):
    """Raised when the 'sub' claim is missing from the refresh token payload."""

    error_code = "INVALID_REFRESH_PAYLOAD"

    def __init__(self, message: str = "Invalid refresh token payload"):
        super().__init__(message)


class InvalidUserIdInTokenError(UnauthorizedError):
    """Raised when the user ID inside the token cannot be cast to int."""

    error_code = "INVALID_USER_ID_IN_TOKEN"

    def __init__(self, message: str = "Invalid user ID in token"):
        super().__init__(message)


class RefreshTokenNotFoundError(UnauthorizedError):
    """Raised when the refresh token does not exist in the database."""

    error_code = "REFRESH_TOKEN_NOT_FOUND"

    def __init__(self, message: str = "Refresh token not found"):
        super().__init__(message)


class TokenRevokedError(UnauthorizedError):
    """Raised when the refresh token has already been revoked."""

    error_code = "TOKEN_REVOKED"

    def __init__(self, message: str = "Token has been revoked"):
        super().__init__(message)


class OtpSendFailedError(Exception):
    """
    Internal error raised when the OTP e-mail delivery fails.
    Intentionally does NOT inherit AppError — it wraps the raw SMTP / network
    exception and is caught + re-raised as a 500 by the service layer.
    """
