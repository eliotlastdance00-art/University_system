from app.core.audit_log import AuditAction, AuditLogger
from app.department.repository import DepartmentRepository
from app.faculty.repository import FacultyRepository

from .exceptions import (
    FacultyAlreadyExistsError,
    FacultyCreateError,
    FacultyNotFoundError,
)
from .schemas import FacultyCreate, FacultyResponse, FacultyUpdate


class FacultyService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = FacultyRepository(conn)
        self.dp_repo = DepartmentRepository(conn)
        self.audit = AuditLogger(conn)

    async def _get_or_404(self, id: int) -> dict:
        faculty = await self.repo.get_faculty_by_id(id)
        if not faculty:
            raise FacultyNotFoundError()
        return faculty

    async def create_faculty(
        self, data: FacultyCreate, actor_id: int | None = None
    ) -> FacultyResponse:
        existing = await self.repo.get_faculty_by_code(data.code)
        if existing:
            raise FacultyAlreadyExistsError()
        

        await self.repo.create_faculty(data.name, data.code)
        faculty = await self.repo.get_faculty_by_code(data.code)
        if not faculty:
            raise FacultyCreateError()

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.CREATE,
            entity_name="faculty",
            entity_id=faculty["id"],
            old_value=None,
            new_value=faculty,
        )

        return FacultyResponse(**faculty)

    async def get_all_faculty(self) -> list[dict]:
        faculties = await self.repo.get_all_faculty()
        return faculties or []

    async def get_faculty_id(self, id: int) -> dict:
        return await self._get_or_404(id)

    async def update_faculty(
        self, id: int, data: FacultyUpdate, actor_id: int | None = None
    ) -> dict:
        faculty = await self._get_or_404(id)
        new_name = data.name if data.name is not None else faculty.get("name", "")
        new_code = data.code if data.code is not None else faculty.get("code", "")

        await self.repo.update_faculty(id, new_name, new_code)

        updated = await self.repo.get_faculty_by_id(id)
        if updated is None:
            raise FacultyNotFoundError()

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.UPDATE,
            entity_name="faculty",
            entity_id=id,
            old_value=faculty,
            new_value=updated,
        )

        return {"message": "Changed Faculty"}

    async def delete_faculty(self, id: int, actor_id: int | None = None):
        faculty = await self._get_or_404(id)
        await self.repo.delete_faculty(id)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.DELETE,
            entity_name="faculty",
            entity_id=id,
            old_value=faculty,
            new_value=None,
        )

        return {"message": "Succesfull delleted this faculty."}

    async def get_faculty_department(self, id: int) -> list[dict]:
        await self._get_or_404(id)
        return await self.dp_repo.get_all_department_faculty(id)
