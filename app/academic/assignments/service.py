from app.academic.assignments.repository import AssignmentRepository
from app.academic.assignments.schemas import AssignmentCreate, AssignmentUpdate

from .exceptions import (
    AssignmentAlreadyExistsError,
    AssignmentDeleteError,
    AssignmentNotFoundError,
)


class AssignmentService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = AssignmentRepository(self.conn)

    async def _get_or_404(self, id: int) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise AssignmentNotFoundError(f"Assignment with ID={id} not found")
        return result

    # ─── CREATE ─────────────────────────────────────────────

    async def create(self, data: AssignmentCreate) -> dict:
        already_exists = await self.repo.exists(
            user_id=data.user_id,
            subject_id=data.subject_id,
            section_id=data.section_id,
            semester=data.semester.value,
        )
        if already_exists:
            raise AssignmentAlreadyExistsError()

        return await self.repo.create(data)

    # ─── GET ALL ─────────────────────────────────────────────

    async def get_all(self) -> list[dict]:
        result = await self.repo.get_all()
        if not result:
            raise AssignmentNotFoundError("No assignments found")
        return result

    # ─── GET BY ID ───────────────────────────────────────────

    async def get_by_id(self, id: int) -> dict:
        return await self._get_or_404(id)

    # ─── GET BY SEMESTER ─────────────────────────────────────

    async def get_by_semester(self, semester: str) -> list[dict]:
        result = await self.repo.get_by_semester(semester)
        if not result:
            raise AssignmentNotFoundError(
                f"No assignments found for semester {semester}"
            )
        return result

    # ─── GET BY GROUP ────────────────────────────────────────

    async def get_by_group(self, section_id: int) -> list[dict]:
        result = await self.repo.get_by_group(section_id)
        if not result:
            raise AssignmentNotFoundError(
                f"No assignments found for group ID={section_id}"
            )
        return result

    # ─── GET BY TEACHER ──────────────────────────────────────

    async def get_by_teacher(self, user_id: int) -> list[dict]:
        result = await self.repo.get_by_teacher(user_id)
        if not result:
            raise AssignmentNotFoundError(
                f"No assignments found for teacher ID={user_id}"
            )
        return result

    # ─── GET BY TEACHER + SEMESTER ───────────────────────────

    async def get_by_teacher_semester(self, user_id: int, semester: str) -> list[dict]:
        result = await self.repo.get_by_teacher_semester(user_id, semester)
        if not result:
            raise AssignmentNotFoundError(
                f"No assignments found for teacher ID={user_id} in semester {semester}"
            )
        return result

    # ─── GET TEACHER SCHEDULE ────────────────────────────────

    async def get_teacher_schedule(self, user_id: int) -> list[dict]:
        result = await self.repo.get_teacher_schedule(user_id)
        if not result:
            raise AssignmentNotFoundError(
                f"No schedule found for teacher ID={user_id}"
            )
        return result

    # ─── UPDATE ──────────────────────────────────────────────

    async def update(self, id: int, data: AssignmentUpdate) -> dict:
        current = await self._get_or_404(id)

        if any([data.user_id, data.subject_id, data.section_id, data.semester]):
            user_id = data.user_id or current["teacher_id"]
            subject_id = data.subject_id or current["subject_id"]
            section_id = data.section_id or current["section_id"]
            semester = data.semester.value if data.semester else current["semester"]

            already_exists = await self.repo.exists(
                user_id=user_id,
                subject_id=subject_id,
                section_id=section_id,
                semester=semester,
                exclude_id=id,
            )
            if already_exists:
                raise AssignmentAlreadyExistsError()

        result = await self.repo.update(id, data)
        if result is None:
            raise AssignmentNotFoundError("Update failed or assignment not found")
        return result

    # ─── DELETE ──────────────────────────────────────────────

    async def delete(self, id: int) -> dict:
        await self._get_or_404(id)

        deleted = await self.repo.delete(id)
        if not deleted:
            raise AssignmentDeleteError(
                "Failed to delete the assignment. Please try again later."
            )
        return {"message": f"ID={id} successfully deleted"}
