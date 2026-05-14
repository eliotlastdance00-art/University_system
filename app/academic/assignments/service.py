from fastapi import HTTPException, status
from app.academic.assignments.repository import AssignmentRepository
from app.academic.assignments.schemas import (
    AssignmentCreate,
    AssignmentUpdate
)




class AssignmentService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = AssignmentRepository(self.conn)

    # ─── CREATE ─────────────────────────────────────────────

    async def create(self, data: AssignmentCreate) -> dict:
        # Duplicate barlag
        already_exists = await self.repo.exists(
            user_id    = data.user_id,
            subject_id = data.subject_id,
            group_id   = data.group_id,
            semester   = data.semester.value
        )
        if already_exists:
            raise HTTPException(
                status_code = status.HTTP_409_CONFLICT,
                detail      = "This teacher has already been assigned to this subject for this group in this semester."
            )

        return await self.repo.create(data)


    # ─── GET ALL ─────────────────────────────────────────────

    async def get_all(self) -> list[dict]:
        result = await self.repo.get_all()
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail      = "Hiç hili bellenme tapylmady"
            )
        return result


    # ─── GET BY ID ───────────────────────────────────────────

    async def get_by_id(self, id: int) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail      = f"ID={id} bellenme tapylmady"
            )
        return result


    # ─── GET BY SEMESTER ─────────────────────────────────────

    async def get_by_semester(self, semester: str) -> list[dict]:
        result = await self.repo.get_by_semester(semester)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail      = f"Semester {semester}-de "
                              f"hiç hili bellenme tapylmady"
            )
        return result


    # ─── GET BY GROUP ────────────────────────────────────────

    async def get_by_group(self, group_id: int) -> list[dict]:
        result = await self.repo.get_by_group(group_id)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail      = f"Topar ID={group_id} üçin "
                              f"hiç hili bellenme tapylmady"
            )
        return result


    # ─── GET BY TEACHER ──────────────────────────────────────

    async def get_by_teacher(self, user_id: int) -> list[dict]:
        result = await self.repo.get_by_teacher(user_id)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail      = f"Mugallym ID={user_id} üçin "
                              f"hiç hili ders tapylmady"
            )
        return result


    # ─── GET BY TEACHER + SEMESTER ───────────────────────────

    async def get_by_teacher_semester(
        self,
        user_id: int,
        semester: str
    ) -> list[dict]:
        result = await self.get_by_teacher_semester(user_id, semester)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail      = f"Mugallym ID={user_id} semester "
                              f"{semester}-de ders tapylmady"
            )
        return result


    # ─── GET TEACHER SCHEDULE ────────────────────────────────

    async def get_teacher_schedule(self, user_id: int) -> list[dict]:
        result = await self.repo.get_teacher_schedule(user_id)
        if not result:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail      = f"Mugallym ID={user_id} üçin "
                              f"tertip tapylmady"
            )
        return result


    # ─── UPDATE ──────────────────────────────────────────────

    async def update(
        self,
        id: int,
        data: AssignmentUpdate
    ) -> dict:

        # Bar ýa ýokdugyny barla
        await self.get_by_id(id)

        # Üýtgedilen maglumat bilen duplicate barlag
        if any([
            data.user_id,
            data.subject_id,
            data.group_id,
            data.semester
        ]):
            current     = await self.get_by_id(id)
            user_id     = data.user_id    or current["teacher_id"]
            subject_id  = data.subject_id or current["subject_id"]
            group_id    = data.group_id   or current["group_id"]
            semester    = data.semester.value if data.semester \
                          else current["semester"]

            already_exists = await self.repo.exists(
                user_id    = user_id,
                subject_id = subject_id,
                group_id   = group_id,
                semester   = semester,
                exclude_id = id
            )
            if already_exists:
                raise HTTPException(
                    status_code = status.HTTP_409_CONFLICT,
                    detail      = "Bu kombinasiýa eýýäm bar!"
                )

        return await self.repo.update(id, data)


    # ─── DELETE ──────────────────────────────────────────────

    async def delete(self, id: int) -> dict:

        # Bar ýa ýokdugyny barla
        await self.get_by_id(id)

        deleted = await self.repo.delete(id)
        if not deleted:
            raise HTTPException(
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail      = "Pozmak başartmady"
            )
        return {"message": f"ID={id} üstünlikli pozuldy"}