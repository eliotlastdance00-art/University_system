from app.academic.attendance.repository import AttendanceRepository
from app.core.dependencies import get_user_id
from app.academic.attendance.schemas import AttendanceBulkCreate, AttendanceUpdate

from .exceptions import (
    AttendanceNotFoundError,
    AttendanceRecordsNotFoundError,
    NotLessonOwnerError,
)


class AttendanceService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = AttendanceRepository(self.conn)

    # ─── KÖMEKÇI ────────────────────────────────────────────

    async def _check_lesson_owner(self, lesson_id: int, user_id: int):
        is_owner = await self.repo.is_lesson_owner(lesson_id, user_id)
        if not is_owner:
            raise NotLessonOwnerError()

    # ─── GET STUDENTS (Lesson başlanda) ──────────────────────

    async def get_students(self, lesson_id: int, current_user: dict) -> list[dict]:
        await self._check_lesson_owner(lesson_id, get_user_id(current_user))

        result = await self.repo.get_students_by_lesson(lesson_id)
        if not result:
            raise AttendanceRecordsNotFoundError(
                "No students found for this lesson."
            )
        return result

    # ─── BULK CREATE (Attendance bellemek) ───────────────────

    async def bulk_create(
        self, lesson_id: int, data: AttendanceBulkCreate, current_user: dict
    ) -> list[dict]:
        await self._check_lesson_owner(lesson_id, get_user_id(current_user))

        records = [
            {"user_id": r.student_id, "status": r.status.value} for r in data.records
        ]

        return await self.repo.bulk_create(lesson_id, records)

    # ─── GET BY LESSON ───────────────────────────────────────

    async def get_by_lesson(self, lesson_id: int) -> list[dict]:
        result = await self.repo.get_by_lesson(lesson_id)
        if not result:
            raise AttendanceRecordsNotFoundError(
                "No attendance records found for this lesson."
            )
        return result

    # ─── GET LESSON STATS ────────────────────────────────────

    async def get_lesson_stats(self, lesson_id: int) -> dict:
        records = await self.repo.get_by_lesson(lesson_id)
        if not records:
            raise AttendanceRecordsNotFoundError(
                "No attendance records found for this lesson."
            )
        return await self.repo.get_lesson_stats(lesson_id)

    # ─── GET BY STUDENT (Admin) ──────────────────────────────

    async def get_by_student(self, student_id: int) -> list[dict]:
        result = await self.repo.get_by_student(student_id)
        if not result:
            raise AttendanceRecordsNotFoundError(
                "No attendance records found for this student."
            )
        return result

    # ─── GET STUDENT STATS ───────────────────────────────────

    async def get_student_stats(self, student_id: int) -> dict:
        return await self.repo.get_student_stats(student_id)

    # ─── GET GROUP STATS ─────────────────────────────────────

    async def get_group_stats(self, section_id: int) -> list[dict]:
        result = await self.repo.get_group_stats(section_id)
        if not result:
            raise AttendanceRecordsNotFoundError(
                "No attendance records found for this section."
            )
        return result

    # ─── UPDATE ──────────────────────────────────────────────

    async def update(self, id: int, data: AttendanceUpdate, current_user: dict) -> dict:
        result = await self.repo.update(id, data.status.value)
        if not result:
            raise AttendanceNotFoundError(
                f"Attendance record with id {id} not found."
            )
        return result
