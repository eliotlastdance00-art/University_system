from firebase_admin.exceptions import FirebaseError

from app.core.exceptions import NotFoundError
from app.notifications.exceptions import NoRecipientsError, UnauthorizedAudienceError
from app.notifications.infrastructure.fcm_client import send_fcm
from app.notifications.repository import (
    AudienceRepository,
    DeviceTokenRepository,
    NotificationLogRepository,
)
from app.notifications.schemas import NotificationOut

# level-e görä "kimden aşak" diýen düzgün — DB-däki `roles.level`-e gabat gelýär
# Hardcode edilen zat diňe "kim kimden pes" diýen umumy san deňeşdirmesi, at sanawy däl


class NotificationService:
    def __init__(
        self,
        audience_repo: AudienceRepository,
        token_repo: DeviceTokenRepository,
        log_repo: NotificationLogRepository,
    ):
        self._audience_repo = audience_repo
        self._token_repo = token_repo
        self._log_repo = log_repo

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
        """
        sender_id — kim iberýär (JWT-den, Depends() arkaly, request body-den DÄL).
        target_role — iberijiniň isleýän audience roly (mysal: dean -> 'teacher' ýa-da 'student').
        Scope (faculty_id/department_id/section_id) HEÇ HAÇAN parametr hökmünde alynmaýar —
        iberijiniň öz profilinden çykarylýar.
        """
        sender_scope = await self._audience_repo.get_sender_scope(sender_id)
        if sender_scope is None:
            raise UnauthorizedAudienceError(sender_id, reason="no_role_assigned")

        sender_level = sender_scope["role_level"]
        sender_role = sender_scope["role_name"]

        # --- 1. Target rol, iberijiden "pes" (level uly) bolmaly ---
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

        # --- 2. Scope, rola görä awtomatik kesgitlenýär ---
        if sender_role == "admin":
            recipient_ids = await self._audience_repo.get_user_ids(
                role_name=target_role
            )

        elif sender_role in ("rector", "prorektor"):
            # uniwersitet derejesi — çäksiz, ýöne diňe özünden pes rollara
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

        return await self._dispatch(sender_id, recipient_ids, title, body)

    async def send_to_user(
        self, sender_id: int, receiver_id: int, title: str, body: str
    ) -> int:
        """Bir adama gönüden habar (system/scheduler-den hem çagyrylyp bilner, sender_id=0 ýaly system ID bilen)."""
        return await self._dispatch(sender_id, [receiver_id], title, body)

    async def _dispatch(
        self, sender_id: int, recipient_ids: list[int], title: str, body: str
    ) -> int:
        tokens = await self._token_repo.get_tokens_for_users(recipient_ids)

        sent_count = 0
        for token in tokens:
            try:
                send_fcm(token, title, body)
                sent_count += 1
            except FirebaseError:
                await self._token_repo.deactivate_token(token)
        log_entries = [(sender_id, uid, title, body, "sent") for uid in recipient_ids]
        await self._log_repo.bulk_create(log_entries)

        return sent_count
