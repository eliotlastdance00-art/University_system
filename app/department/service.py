from app.academic.programs.repository import ProgramRepository
from app.core.audit_log import AuditAction, AuditLogger

from .exceptions import DepartmentAlreadyExistsError, DepartmentNotFoundError
from .repository import DepartmentRepository
from .schemas import DepartmentCreate, DepartmentUpdate


class DepartmentService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = DepartmentRepository(conn)
        self.prog_repo = ProgramRepository(conn)
        self.audit = AuditLogger(conn)

    async def _get_or_404(self, id: int) -> dict:
        """Raises DepartmentNotFoundError if the department does not exist."""
        department = await self.repo.get_department_by_id(id)
        if not department:
            raise DepartmentNotFoundError()
        return department

    async def create_department(
        self, data: DepartmentCreate, actor_id: int | None = None
    ) -> dict:
        existing = await self.repo.get_department_by_name(data.name)
        if existing:
            raise DepartmentAlreadyExistsError()

        await self.repo.create_department(data.name, data.faculty_id)

        # Fetch the newly created row so we have its id for the audit
        # log and for a consistent response shape with other domains.
        created = await self.repo.get_department_by_name(data.name)
        if created is None:
            raise DepartmentNotFoundError()

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.CREATE,
            entity_name="department",
            entity_id=created["id"],
            old_value=None,
            new_value=created,
        )

        return {"message": "Successfully created department"}

    async def update_department(
        self, id: int, data: DepartmentUpdate, actor_id: int | None = None
    ) -> dict:
        department = await self._get_or_404(id)

        # `is not None` is required here instead of `or` - a falsy but
        # valid value (e.g. faculty_id=0) must not be silently ignored.
        new_name = data.name if data.name is not None else department["name"]
        new_faculty_id = (
            data.faculty_id if data.faculty_id is not None else department["faculty_id"]
        )

        await self.repo.update_department(id, new_name, new_faculty_id)

        updated = await self.repo.get_department_by_id(id)
        if updated is None:
            raise DepartmentNotFoundError()

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.UPDATE,
            entity_name="department",
            entity_id=id,
            old_value=department,
            new_value=updated,
        )

        return {"message": "Successfully updated this department"}

    async def delete_department(self, id: int, actor_id: int | None = None) -> dict:
        department = await self._get_or_404(id)
        await self.repo.delete_department(id)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.DELETE,
            entity_name="department",
            entity_id=id,
            old_value=department,
            new_value=None,
        )

        return {"message": "Successfully deleted that department"}

    async def get_departments_by_faculty(self, faculty_id: int) -> list[dict]:
        return await self.repo.get_all_department_faculty(faculty_id)

    async def get_departments_paginated(
        self, last_id: int = 0, limit: int = 10
    ) -> dict:
        """Cursor-based pagination: returns departments with id > last_id."""
        existing = await self.repo.get_departments_incrementally(last_id, limit)

        if not existing:
            return {"items": [], "next_id": None, "has_more": False}

        last_fetched_id = existing[-1]["id"]

        return {
            "items": existing,
            "next_id": last_fetched_id,
            "has_more": len(existing) == limit,
        }

    async def get_department_by_id(self, id: int) -> dict:
        return await self._get_or_404(id)

    async def get_department_programs(self, department_id: int) -> list[dict]:
        await self._get_or_404(department_id)
        return await self.prog_repo.get_department_programs(department_id)

    async def get_department_teachers(self, department_id: int) -> list[dict]:
        await self._get_or_404(department_id)
        return await self.repo.get_department_teachers(department_id)

    async def get_department_students(self, department_id: int) -> list[dict]:
        await self._get_or_404(department_id)
        return await self.repo.get_department_students(department_id)
