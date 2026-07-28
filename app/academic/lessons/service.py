from datetime import date

from app.academic.lessons.repository import LessonRepository
from app.academic.lessons.schemas import LessonCancel
from app.academic.timetable.repository import TimetableRepository
from app.academic.timetable.exceptions import TimetableNotFoundError

from .exceptions import (
    LessonAlreadyCancelledError,
    LessonAlreadyStartedError,
    LessonNotFoundError,
    NotLessonTeacherError,
)


class LessonService:

    def __init__(self, conn):
        self.conn = conn
        self.repo = LessonRepository(self.conn)
        self.trepo = TimetableRepository(self.conn)

    # ─── KÖMEKÇI ────────────────────────────────────────────

    async def _get_or_404(self, id: int) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise LessonNotFoundError(f"Lesson ID={id} not found")
        return result

    async def _check_owner(self, lesson_id: int, user_id: int):
        is_owner = await self.repo.is_owner(lesson_id, user_id)
        if not is_owner:
            raise NotLessonTeacherError()

    # ─── START (Sapak başlat) ────────────────────────────────

    async def start(self, timetable_id: int, current_user: dict) -> dict:
        # 1. Timetable barmy?
        timetable = await self.trepo.get_by_id(timetable_id)
        if not timetable:
            raise TimetableNotFoundError()

        # 2. Mugallymyňmy?
        if timetable["teacher_id"] != current_user["id"]:
            raise NotLessonTeacherError()

        # 3. Duplicate barmy?
        today = date.today()
        exists = await self.repo.exists(timetable_id, today)
        if exists:
            raise LessonAlreadyStartedError()

        return await self.repo.create(timetable_id, today)

    # ─── CANCEL (Sapak ýatyr) ────────────────────────────────

    async def cancel(self, id: int, data: LessonCancel, current_user: dict) -> dict:
        # 1. Bar ýa ýok?
        lesson = await self._get_or_404(id)

        # 2. Mugallymyňmy?
        await self._check_owner(id, current_user["id"])

        # 3. Eýýäm ýatyrylanmy?
        if lesson["status"] == "cancelled":
            raise LessonAlreadyCancelledError()

        return await self.repo.cancel(id, data.note)

    # ─── GET ALL (Admin) ─────────────────────────────────────

    async def get_all(self) -> list[dict]:
        result = await self.repo.get_all()
        if not result:
            raise LessonNotFoundError("No lessons found")
        return result

    # ─── GET BY DATE (Admin) ─────────────────────────────────

    async def get_by_date(self, date: date) -> list[dict]:
        result = await self.repo.get_by_date(date)
        if not result:
            raise LessonNotFoundError(f"No lessons found for {date}")
        return result

    # ─── GET BY TIMETABLE ────────────────────────────────────

    async def get_by_timetable(self, timetable_id: int) -> list[dict]:
        result = await self.repo.get_by_timetable(timetable_id)
        if not result:
            raise LessonNotFoundError("No lessons found for this timetable.")
        return result

    # ─── GET MY HISTORY (Teacher) ────────────────────────────

    async def get_my_history(self, current_user: dict) -> list[dict]:
        result = await self.repo.get_my_history(current_user["id"])
        if not result:
            raise LessonNotFoundError("No lesson history found for this teacher.")
        return result

    # ─── GET MY STATS (Teacher) ──────────────────────────────

    async def get_my_stats(self, current_user: dict) -> dict:
        return await self.repo.get_my_stats(current_user["id"])