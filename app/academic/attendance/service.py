from fastapi import HTTPException, status
from app.academic.attendance.repository import AttendanceRepository
from app.academic.attendance.schemas import (
    AttendanceBulkCreate,
    AttendanceUpdate
)




class AttendanceService:
    def __init__(self,conn):
        self.conn = conn
        self.repo = AttendanceRepository(self.conn)

    # ─── KÖMEKÇI ────────────────────────────────────────────

    async def _check_lesson_owner(
        self,
        lesson_id: int,
        user_id: int
    ):
        is_owner = await self.repo.is_lesson_owner(
            lesson_id, user_id
        )
        if not is_owner:
            raise HTTPException(
                status_code = status.HTTP_403_FORBIDDEN,
                detail = "Bu siziň sapakyňyz däl!"
            )


    # ─── GET STUDENTS (Lesson başlanda) ──────────────────────

    async def get_students(
        self,
        lesson_id: int,
        current_user: dict
    ) -> list[dict]:
        

        await self._check_lesson_owner(
            lesson_id,
            current_user["user_id"]
        )

        result = await self.repo.get_students_by_lesson(lesson_id)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail = "Bu sapakda student tapylmady"
            )
        return result


    # ─── BULK CREATE (Attendance bellemek) ───────────────────

    async def bulk_create(
        self,
        lesson_id: int,
        data: AttendanceBulkCreate,
        current_user: dict
    ) -> list[dict]:

        await self._check_lesson_owner(
            lesson_id,
            current_user["user_id"]
        )

        records = [
            {
                "student_id": r.student_id,
                "status": r.status.value
            }
            for r in data.records
        ]

        return await self.repo.bulk_create(lesson_id, records)


    # ─── GET BY LESSON ───────────────────────────────────────

    async def get_by_lesson(
        self,
        lesson_id: int
    ) -> list[dict]:
        result = await self.repo.get_by_lesson(lesson_id)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail = "Bu sapak üçin gatnaw tapylmady"
            )
        return result


    # ─── GET LESSON STATS ────────────────────────────────────

    async def get_lesson_stats(
        self,
        lesson_id: int
    ) -> dict:
        lesson_id= await self.repo.get_by_lesson(lesson_id)
        if not lesson_id:
            raise HTTPException(
                status_code=404,
                detail="Not found lesson"
            )
        return await self.repo.get_lesson_stats(lesson_id)


    # ─── GET BY STUDENT (Admin) ──────────────────────────────

    async def get_by_student(
        self,
        student_id: int
    ) -> list[dict]:
        result = await self.repo.get_by_student(student_id)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail = "Bu student üçin gatnaw tapylmady"
            )
        return result


    # ─── GET STUDENT STATS ───────────────────────────────────

    async def get_student_stats(
        self,
        student_id: int
    ) -> dict:
        return await self.repo.get_student_stats(student_id)


    # ─── GET GROUP STATS ─────────────────────────────────────

    async def get_group_stats(
        self,
        group_id: int
    ) -> list[dict]:
        result = await self.repo.get_group_stats(group_id)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail = "Bu topar üçin gatnaw tapylmady"
            )
        return result


    # ─── UPDATE ──────────────────────────────────────────────

    async def update(
        self,
        id: int,
        data: AttendanceUpdate,
        current_user: dict
    ) -> dict:
        result = await self.repo.update(id, data.status.value)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail = f"Gatnaw ID={id} tapylmady"
            )
        return result