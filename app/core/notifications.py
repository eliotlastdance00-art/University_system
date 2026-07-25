"""
Firebase Cloud Messaging (FCM) notifications.

Designed for graceful degradation:
  - If firebase-admin is not installed or not configured, logs a warning
    and silently skips — never raises.
  - Notification failures are logged but never propagate exceptions.
  - This ensures a failed push notification does NOT roll back
    the database transaction.

To enable real FCM:
  1. pip install firebase-admin
  2. Set FIREBASE_CREDENTIALS_PATH in .env pointing to the service account JSON
  3. This module will auto-initialise on first import
"""

from app.core.logger import logger

# Try to initialise Firebase Admin SDK
_firebase_app = None

try:
    import firebase_admin
    from firebase_admin import credentials, messaging

    from app.core.config import settings

    cred_path = getattr(settings, "FIREBASE_CREDENTIALS_PATH", None)
    if cred_path:
        cred = credentials.Certificate(cred_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialised successfully")
    else:
        logger.warning("FIREBASE_CREDENTIALS_PATH not set — FCM notifications disabled")
except ImportError:
    logger.warning("firebase-admin package not installed — FCM notifications disabled")
except Exception as exc:
    logger.error(f"Firebase initialisation failed: {exc}")


async def send_notification(
    user_id: int,
    title: str,
    body: str,
    fcm_token: str | None = None,
) -> bool:
    """
    Send an FCM push notification.

    Parameters
    ----------
    user_id : int
        Target user (for logging context).
    title : str
        Notification title.
    body : str
        Notification body text.
    fcm_token : str | None
        Device FCM registration token.  If None, we skip sending
        (the student hasn't registered a device yet).

    Returns
    -------
    bool
        True if sent successfully, False otherwise.
    """
    if _firebase_app is None or fcm_token is None:
        logger.info(
            "notification_skipped",
            extra={
                "context": {
                    "user_id": user_id,
                    "reason": "no_firebase"
                    if _firebase_app is None
                    else "no_fcm_token",
                }
            },
        )
        return False

    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            token=fcm_token,
        )
        response = messaging.send(message)
        logger.info(
            "notification_sent",
            extra={
                "context": {
                    "user_id": user_id,
                    "message_id": response,
                }
            },
        )
        return True
    except Exception as exc:
        logger.error(
            f"notification_failed: {exc}",
            extra={"context": {"user_id": user_id}},
        )
        return False
