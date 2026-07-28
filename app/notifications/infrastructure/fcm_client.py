# notifications/infrastructure/fcm_client.py
import logging

import firebase_admin
from firebase_admin import credentials, messaging
from firebase_admin.exceptions import FirebaseError

logger = logging.getLogger(__name__)

_firebase_app = None


def init_firebase(cred_path: str) -> None:
    """App başlananda 1 gezek çagyrylýar (main.py lifespan-da)."""
    global _firebase_app
    if _firebase_app is not None:
        return

    cred = credentials.Certificate(cred_path)
    _firebase_app = firebase_admin.initialize_app(cred)
    logger.info("firebase_initialized")


def send_fcm(token: str, title: str, body: str) -> str:
    """
    Bir token-e push iberýär. Firebase message ID-sini gaýtaryp berýär.
    Habar iberip bolmasa FirebaseError raise edýär — service.py muny tutup,
    şol token-i deactivate edýär.
    """
    if _firebase_app is None:
        raise RuntimeError(
            "Firebase not initialized — call init_firebase() at startup first"
        )

    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        token=token,
    )
    try:
        message_id = messaging.send(message)
        return message_id
    except FirebaseError as exc:
        logger.warning("fcm_send_failed", extra={"token": token, "reason": str(exc)})
        raise
