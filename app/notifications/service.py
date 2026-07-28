from firebase_admin.exceptions import FirebaseError

from app.core.audit_log import AuditAction, AuditLogger
from app.core.exceptions import NotFoundError
from app.notifications.exceptions import NoRecipientsError, UnauthorizedAudienceError
from app.notifications.infrastructure.fcm_client import send_fcm
from app.notifications.repository import (
    AudienceRepository,
    DeviceTokenRepository,
    NotificationLogRepository,
)
from app.notifications.schemas import NotificationOut


class NotificationService:
    def __init__(
        self,
        audience_repo: AudienceRepository,
        token_repo: DeviceTokenRepository,
        log_repo: NotificationLogRepository,
        audit_logger: AuditLogger,
    ):
        self._audience_repo = audience_repo
        self._token_repo = token_repo
        self._log_repo = log_repo
        self._audit = audit_logger

    async def get_notifications_for_user(
        self, user_id: int, limit: int = 20, offset: int = 0
    ) -> list[NotificationOut]:
        rows = await self._log_repo.get_by_receiver(user_id, limit, offset)
        return [NotificationOut(**row) for row in rows]

    async def mark_as_read(self, notification_id: int, user_id: int) -> None:
        updated = await self._log_repo.mark_as_read(notification_id, user_id)
        if not updated:
            raise NotFoundError(
                f"Notification {notification_id} not found for this user"
            )

    async def register_device_token(
        self, user_id: int, token: str, device_type: str
    ) -> None:
        await self._token_repo.upsert_token(user_id, token, device_type)

    async def broadcast(
        self,
        sender_id: int,
        title: str,
        body: str,
        target_role: str | None = None,
    ) -> int:
        sender_scope = await self._audience_repo.get_sender_scope(sender_id)
        if sender_scope is None:
            raise UnauthorizedAudienceError(sender_id, reason="no_role_assigned")

        sender_level = sender_scope["role_level"]
        sender_role = sender_scope["role_name"]

        target_level = (
            await self._audience_repo.get_role_level(target_role)
            if target_role
            else None
        )
        if target_role is not None and (
            target_level is None or target_level <= sender_level
        ):
            raise UnauthorizedAudienceError(
                sender_id, reason=f"{sender_role} cannot target {target_role}"
            )

        if sender_role == "admin" or sender_role in ("rector", "prorektor"):
            recipient_ids = await self._audience_repo.get_user_ids(
                role_name=target_role
            )

        elif sender_role == "dean":
            recipient_ids = await self._audience_repo.get_user_ids(
                role_name=target_role, faculty_id=sender_scope["faculty_id"]
            )

        elif sender_role == "department_head":
            recipient_ids = await self._audience_repo.get_user_ids(
                role_name=target_role, department_id=sender_scope["department_id"]
            )

        elif sender_role == "teacher":
            if target_role != "student":
                raise UnauthorizedAudienceError(
                    sender_id, reason="teacher_target_must_be_student"
                )
            section_ids = await self._audience_repo.get_teacher_section_ids(sender_id)
            recipient_ids = await self._audience_repo.get_user_ids_in_sections(
                section_ids
            )

        else:
            raise UnauthorizedAudienceError(
                sender_id, reason=f"{sender_role}_cannot_broadcast"
            )

        if not recipient_ids:
            raise NoRecipientsError()

        sent_count = await self._dispatch(sender_id, recipient_ids, title, body)
        await self._audit.log(
            actor_id=sender_id,
            action=AuditAction.BROADCAST,
            entity_name="notification",
            entity_id=None,
            old_value=None,
            new_value={
                "target_role": target_role,
                "recipient_count": len(recipient_ids),
                "sent_count": sent_count,
                "title": title,
            },
        )

        return sent_count

    async def send_to_user(
        self, sender_id: int, receiver_id: int, title: str, body: str
    ) -> int:
        return await self._dispatch(sender_id, [receiver_id], title, body)

    async def _dispatch(
        self, sender_id: int, recipient_ids: list[int], title: str, body: str
    ) -> int:
        token_pairs = await self._token_repo.get_tokens_for_users(recipient_ids)

        sent_user_ids: set[int] = set()
        for user_id, token in token_pairs:
            try:
                send_fcm(token, title, body)
                sent_user_ids.add(user_id)
            except FirebaseError:
                await self._token_repo.deactivate_token(token)

        log_entries = [
            (sender_id, uid, title, body, "sent" if uid in sent_user_ids else "failed")
            for uid in recipient_ids
        ]
        await self._log_repo.bulk_create(log_entries)

        return len(sent_user_ids)
