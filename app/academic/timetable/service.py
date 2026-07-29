from datetime import time

from app.academic.assignments.exceptions import AssignmentNotFoundError
from app.academic.assignments.repository import AssignmentRepository
from app.academic.timetable.repository import TimetableRepository
from app.academic.timetable.schemas import (
    TimetableCreate,
    TimetableEnum,
    TimetableUpdate,
)
from app.core.audit_log import AuditAction, AuditLogger

from .exceptions import (
    InvalidTimeRangeError,
    TeacherScheduleConflictError,
    TimetableConflictError,
    TimetableNotFoundError,
)


class TimetableService:
    def __init__(self, conn):
        self.conn = conn
        self.asrepo = AssignmentRepository(self.conn)
        self.repo = TimetableRepository(self.conn)
        self.audit = AuditLogger(self.conn)

    async def get_or_404(self, id: int) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise TimetableNotFoundError()
        return result

    async def check_time(self, start_time: time, end_time: time) -> bool:
        if start_time >= end_time:
            raise InvalidTimeRangeError()
        return True

    async def check_teacher_conflict(
        self, user_id: int, day: str, start_time: str, exclude_id: int | None
    ) -> None:
        conflict = await self.repo.teacher_conflict(
            user_id, day, start_time, exclude_id
        )
        if conflict:
            raise TeacherScheduleConflictError()

    async def _check_duplicate(
        self, assignment_id: int, day: str, start_time: str, exclude_id: int | None
    ) -> None:
        existing = await self.repo.exists(assignment_id, day, start_time, exclude_id)
        if existing:
            raise TimetableConflictError()

    async def create(self, data: TimetableCreate, actor_id: int | None = None) -> dict:
        assignment = await self.asrepo.get_by_id(data.assignment_id)
        if not assignment:
            raise AssignmentNotFoundError()
        await self.check_time(data.start_time, data.end_time)
        await self._check_duplicate(
            assignment_id=data.assignment_id,
            day=data.day.value,
            start_time=str(data.start_time),
            exclude_id=None,
        )
        await self.check_teacher_conflict(
            user_id=assignment["teacher_id"],
            day=data.day.value,
            start_time=str(data.start_time),
            exclude_id=None,
        )
        created = await self.repo.create(data)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.CREATE,
            entity_name="timetable",
            entity_id=created["id"],
            old_value=None,
            new_value=dict(created),
        )
        return created

    async def get_all(self) -> list[dict]:
        timetables = await self.repo.get_all()
        if not timetables:
            raise TimetableNotFoundError("Timetable is empty")
        return timetables

    async def get_by_id(self, id: int) -> dict:
        return await self.get_or_404(id)

    async def get_group(self, section_id: int) -> list[dict]:
        group = await self.repo.get_all_group_week(section_id)
        if not group:
            raise TimetableNotFoundError("No timetable found for this group")
        return group

    async def get_day_group(self, day: TimetableEnum, section_id: int) -> list[dict]:
        result = await self.repo.get_day_group(section_id, day)
        if not result:
            raise TimetableNotFoundError(
                "No timetable found for this group on this day"
            )
        return result

    async def get_teacher_timetable(self, user_id: int) -> list[dict]:
        teacher = await self.repo.get_by_teacher(user_id)
        if not teacher:
            raise TimetableNotFoundError("No timetable found for this teacher")
        return teacher

    async def get_teacher_timetable_day(self, user_id: int, day: str) -> list[dict]:
        teacher = await self.repo.get_by_teacher_day(user_id, day)
        if not teacher:
            raise TimetableNotFoundError(
                "No timetable found for this teacher on this day"
            )
        return teacher

    async def update(
        self, id: int, data: TimetableUpdate, actor_id: int | None = None
    ) -> dict:
        current = await self.get_or_404(id)

        start_time = data.start_time or current["start_time"]
        end_time = data.end_time or current["end_time"]
        await self.check_time(start_time, end_time)

        if data.day or data.start_time:
            day = data.day.value if data.day else current["day"]
            start = (
                str(data.start_time) if data.start_time else str(current["start_time"])
            )

            await self._check_duplicate(
                assignment_id=current["assignment_id"],
                day=day,
                start_time=start,
                exclude_id=id,
            )
            await self.check_teacher_conflict(
                user_id=current["teacher_id"], day=day, start_time=start, exclude_id=id
            )

        await self.repo.update(id, data)
        updated = await self.get_or_404(id)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.UPDATE,
            entity_name="timetable",
            entity_id=id,
            old_value=dict(current),
            new_value=dict(updated),
        )
        return updated

    async def delete(self, id: int, actor_id: int | None = None) -> dict:
        current = await self.get_or_404(id)
        deleted = await self.repo.delete(id)
        if not deleted:
            from app.core.exceptions import AppError

            raise AppError("Failed to delete timetable entry")

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.DELETE,
            entity_name="timetable",
            entity_id=id,
            old_value=dict(current),
            new_value=None,
        )
        return {"message": f"ID={id} succesfully deleted"}
