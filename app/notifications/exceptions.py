# notifications/exceptions.py
from app.core.exceptions import ForbiddenError, NotFoundError


class UnauthorizedAudienceError(ForbiddenError):
    error_code = "UNAUTHORIZED_AUDIENCE"

    def __init__(self, sender_id: int, reason: str):
        super().__init__(
            f"User {sender_id} is not authorized to send this notification: {reason}"
        )
        self.sender_id = sender_id
        self.reason = reason


class NoRecipientsError(NotFoundError):
    error_code = "NO_RECIPIENTS"

    def __init__(self, message: str = "No recipients matched the given audience criteria"):
        super().__init__(message)


class DeviceTokenNotFoundError(NotFoundError):
    error_code = "TOKEN_NOT_FOUND"

    def __init__(self, user_id: int):
        super().__init__(f"No active device token for user {user_id}")
        self.user_id = user_id