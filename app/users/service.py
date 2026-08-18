from app.academic.sections.exceptions import SectionNotFoundError
from app.core.audit_log import AuditAction, AuditLogger
from app.core.logger import get_domain_logger
from app.core.security import hash_password

from .exceptions import (
    RoleAlreadyAssignedError,
    RoleNotAssignedError,
    RoleNotFoundError,
    SectionFullError,
    StudentRoleRequiredError,
    UserAlreadyExistsError,
    UserNotFoundError,
)
from .repository import UsersRepository
from .schemas import UserCreate, UserResponse, UserSearchFilters, UserUpdate

logger = get_domain_logger("users")

# password_hash ýaly meýdanlary audit-e ýazmazlyk üçin
SENSITIVE_FIELDS = {"password", "password_hash"}


def _strip_sensitive(data: dict) -> dict:
    return {k: v for k, v in data.items() if k not in SENSITIVE_FIELDS}


class UserService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = UsersRepository(self.conn)
        self.audit = AuditLogger(self.conn)

    async def _get_or_404(self, id: int) -> dict:
        """Kullanıcı varlığını kontrol eden ortak helper metot."""
        user = await self.repo.get_by_id_users(id)
        if not user:
            raise UserNotFoundError()
        return user

    async def user_create(
        self, data: UserCreate, actor_id: int | None = None
    ) -> UserResponse:
        hash_pass = hash_password(data.password)
        existing_user = await self.repo.get_by_email_users(data.email)
        if existing_user:
            raise UserAlreadyExistsError()

        await self.repo.create_user(data.full_name, data.email, hash_pass)
        created_user = await self.repo.get_by_email_users(data.email)

        await self.audit.log(
            actor_id=actor_id or created_user["id"],
            action=AuditAction.CREATE,
            entity_name="user",
            entity_id=created_user["id"],
            old_value=None,
            new_value=_strip_sensitive(created_user),
        )

        logger.info(
            "New user account successfully created",
            extra={"email": data.email, "new_user_id": created_user["id"]},
        )

        return UserResponse(**created_user)

    async def get_all(self) -> list[UserResponse]:
        users = await self.repo.get_all_users()
        return [UserResponse(**u) for u in users]

    async def get_user_by_id(self, user_id: int) -> UserResponse:
        user = await self._get_or_404(user_id)
        return UserResponse(**user)

    async def update_user(
        self, id: int, data: UserUpdate, actor_id: int | None = None
    ) -> dict:
        current_user = await self._get_or_404(id)

        new_full_name = (
            data.full_name if data.full_name is not None else current_user["full_name"]
        )
        new_email = data.email if data.email is not None else current_user["email"]
        new_is_active = (
            data.is_active if data.is_active is not None else current_user["is_active"]
        )

        if data.password is not None:
            hashed_pass = hash_password(data.password)
            await self.repo.update_user(
                id, new_full_name, new_email, hashed_pass, new_is_active
            )
        else:
            await self.repo.update_user_without_password(
                id, new_full_name, new_email, new_is_active
            )

        updated_user = await self.repo.get_by_id_users(id)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.UPDATE,
            entity_name="user",
            entity_id=id,
            old_value=_strip_sensitive(current_user),
            new_value=_strip_sensitive(updated_user),
        )

        if data.password is not None:
            await self.audit.log(
                actor_id=actor_id,
                action=AuditAction.PASSWORD_CHANGE,
                entity_name="user",
                entity_id=id,
                old_value=None,
                new_value=None,
            )

        logger.info(
            "User details updated successfully",
            extra={
                "updated_user_id": id,
                "actor_id": actor_id,
                "password_changed": data.password is not None,
            },
        )

        return {"message": "Changed user ✅"}

    async def delete_user(self, id: int, actor_id: int | None = None) -> dict:
        user = await self._get_or_404(id)  # pozulmazdan öňki ýagdaýy sakla
        await self.repo.delete_user(id)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.DELETE,
            entity_name="user",
            entity_id=id,
            old_value=_strip_sensitive(user),
            new_value=None,  # pozulany üçin täze ýagdaý ýok
        )

        logger.info(
            "User account permanently deleted",
            extra={"deleted_user_id": id, "actor_id": actor_id},
        )

        return {"message": "Delete user ✅"}

    async def give_role(
        self,
        user_id: int,
        role_id: int,
        faculty_id: int | None = None,
        department_id: int | None = None,
        section_id: int | None = None,
        actor_id: int | None = None,
    ) -> dict:
        await self._get_or_404(user_id)

        role = await self.repo.role_by_id(role_id)
        if not role:
            raise RoleNotFoundError()

        existing_role = await self.repo.get_user_role(user_id, role_id)
        if existing_role:
            raise RoleAlreadyAssignedError()

        await self.repo.assign_role(user_id, role_id)
        await self.repo.assign_profile(user_id, faculty_id, department_id, section_id)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.ROLE_ASSIGN,
            entity_name="user_role",
            entity_id=user_id,
            old_value=None,
            new_value={
                "role_id": role_id,
                "faculty_id": faculty_id,
                "department_id": department_id,
                "section_id": section_id,
            },
        )

        logger.info(
            "Role successfully assigned to user",
            extra={
                "target_user_id": user_id,
                "role_id": role_id,
                "faculty_id": faculty_id,
                "department_id": department_id,
                "actor_id": actor_id,
            },
        )

        return {"message": "Successfully given role"}

    async def show_roles(self, user_id: int) -> list:
        await self._get_or_404(user_id)
        return await self.repo.get_user_roles_all(user_id)

    async def delete_role(
        self, user_id: int, role_id: int, actor_id: int | None = None
    ) -> dict:
        await self._get_or_404(user_id)

        existing_role = await self.repo.get_user_role(user_id, role_id)
        if not existing_role:
            raise RoleNotAssignedError()

        await self.repo.remove_role(user_id, role_id)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.ROLE_REVOKE,
            entity_name="user_role",
            entity_id=user_id,
            old_value={"role_id": role_id},
            new_value=None,
        )

        logger.info(
            "Role successfully removed from user",
            extra={
                "target_user_id": user_id,
                "revoked_role_id": role_id,
                "actor_id": actor_id,
            },
        )

        return {"message": "Role successfully removed"}

    async def search_users(self, filter: UserSearchFilters) -> list[UserResponse]:
        return [
            UserResponse(**u)
            for u in await self.repo.search_users(
                name=filter.name,
                role=filter.role,
                faculty_id=filter.faculty_id,
                department_id=filter.department_id,
                section_id=filter.section_id,
            )
        ]

    async def assign_section(
        self, user_id: int, section_id: int, actor_id: int | None = None
    ):
        user = await self._get_or_404(user_id)

        role = await self.repo.get_role_by_name("student")
        if not role:
            raise RoleNotFoundError("Student role not found in system")

        is_student = await self.repo.get_user_role(user_id, role["id"])
        if not is_student:
            raise StudentRoleRequiredError()

        section = await self.repo.get_section_by_id_for_update(section_id)
        if not section:
            raise SectionNotFoundError()

        count = await self.repo.get_section_student_count(section_id)
        if count["total"] >= section["capacity"]:
            raise SectionFullError()

        old_section_id = user.get("section_id")

        await self.repo.update_user_section(user_id, section_id)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.SECTION_ASSIGN,
            entity_name="user",
            entity_id=user_id,
            old_value={"section_id": old_section_id},
            new_value={"section_id": section_id},
        )

        logger.info(
            "Student successfully assigned to section",
            extra={
                "student_user_id": user_id,
                "section_id": section_id,
                "old_section_id": old_section_id,
            },
        )

        return {"success": "Student assigned to section successfully"}
