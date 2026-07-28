from app.core.audit_log import AuditAction, AuditLogger
from app.profile.repository import ProfileRepository
from app.profile.schemas import UpdateProfile

from .exceptions import EmailAlreadyInUseError, ProfileNotFoundError

SENSITIVE_FIELDS = {"password", "password_hash"}


def _strip_sensitive(data: dict) -> dict:
    return {k: v for k, v in data.items() if k not in SENSITIVE_FIELDS}


class ProfileService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = ProfileRepository(conn)
        self.audit = AuditLogger(conn)

    async def get_profile_me(self, user_id):
        result = await self.repo.get_profile_me(user_id)
        if not result:
            raise ProfileNotFoundError()
        return {k: v for k, v in result.items() if v is not None}

    async def update_profile_me(self, data: UpdateProfile, actor_id: int | None = None):
        result = await self.repo.get_profile_me(data.id)
        if not result:
            raise ProfileNotFoundError()
        if data.email and data.email != result["email"]:
            email_owner = await self.repo.get_profile_by_email(data.email)
            if email_owner and email_owner["id"] != data.id:
                raise EmailAlreadyInUseError()

        new_full_name = data.name or result["full_name"]
        new_email = data.email or result["email"]
        new_faculty_id = data.faculty_id or result["faculty_id"]
        new_department_id = data.department_id or result["department_id"]
        new_section_id = data.section_id or result["section_id"]

        await self.repo.update_profile_me(
            id=data.id,
            full_name=new_full_name,
            email=new_email,
            faculty_id=new_faculty_id,
            department_id=new_department_id,
            section_id=new_section_id,
        )

        updated = await self.repo.get_profile_me(data.id)
        if updated is None:
            raise ProfileNotFoundError()

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.UPDATE,
            entity_name="profile",
            entity_id=data.id,
            old_value=_strip_sensitive(result),
            new_value=_strip_sensitive(updated),
        )

    async def update_password_me(self, id, new_password, actor_id: int | None = None):
        await self.repo.update_password_me(id, new_password)

        # Parol asla old_value/new_value hökmünde ýazylmaýar - diňe
        # "waka boldy" diýen ýazgy ýeterlik, mazmun gerek däl.
        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.PASSWORD_CHANGE,
            entity_name="profile",
            entity_id=id,
            old_value=None,
            new_value=None,
        )
