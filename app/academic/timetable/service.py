from datetime import time

from arq import create_pool
from arq.connections import RedisSettings

from app.academic.assignments.exceptions import AssignmentNotFoundError
from app.academic.assignments.repository import AssignmentRepository
from app.academic.timetable.repository import TimetableRepository
from app.academic.timetable.schemas import (
    RoomCreate,
    RoomUpdate,
    TimetableCreate,
    TimetableEnum,
    TimetableUpdate,
)
from app.core.audit_log import AuditAction, AuditLogger
from app.core.config import settings

from .exceptions import (
    InvalidTimeRangeError,
    RoomNotFoundError,
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

    # ═══════════════════════════════════════════════════════════
    # GENERATION TASKS & DRAFTS
    # ═══════════════════════════════════════════════════════════

    async def _get_redis_pool(self):

        return await create_pool(
            RedisSettings(host=settings.REDIS_HOST, port=settings.REDIS_PORT)
        )

    async def create_generation_task(self, actor_id: int, parameters: dict) -> dict:
        # 1. Veritabanında PENDING statüsünde task oluştur
        task = await self.repo.create_task(created_by=actor_id, parameters=parameters)

        # 2. Redis üzerinden ARQ worker'a işi gönder
        redis = await self._get_redis_pool()
        await redis.enqueue_job("generate_timetable_task", task["id"], parameters)
        await redis.close()

        return task

    async def get_generation_tasks(self) -> list[dict]:
        return await self.repo.get_all_tasks()

    async def get_generation_task(self, task_id: int) -> dict:
        task = await self.repo.get_task(task_id)
        if not task:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Task not found")
        return task

    async def get_task_drafts(self, task_id: int) -> list[dict]:
        await self.get_generation_task(task_id)
        return await self.repo.get_drafts_by_task(task_id)

    async def apply_task_drafts(self, task_id: int, actor_id: int) -> dict:
        task = await self.get_generation_task(task_id)
        if task["status"] != "COMPLETED":
            from app.core.exceptions import ValidationError

            raise ValidationError("Can only apply COMPLETED tasks")

        drafts = await self.repo.get_drafts_by_task(task_id)
        if not drafts:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("No drafts found for this task")

        created_timetables = []
        for d in drafts:
            from datetime import datetime, timedelta

            def _to_time(val):
                """Convert DB value (str, timedelta, or time) to datetime.time."""
                if isinstance(val, timedelta):
                    total_seconds = int(val.total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    seconds = total_seconds % 60
                    return time(hours, minutes, seconds)
                if isinstance(val, str):
                    from datetime import timezone
                    fmt = "%H:%M:%S"
                    return datetime.strptime(val, fmt).replace(tzinfo=timezone.utc).time()
                # Already a time object
                return val

            st = _to_time(d["start_time"])
            et = _to_time(d["end_time"])

            data = TimetableCreate(
                assignment_id=d["assignment_id"],
                day=TimetableEnum(d["day"]),
                start_time=st,
                end_time=et,
                room=d.get("room") or "",
                room_id=d.get("room_id"),
            )
            # This self.create does conflict checking.
            t = await self.create(data, actor_id=actor_id)
            created_timetables.append(t)

        # Clean up
        await self.repo.delete_drafts_by_task(task_id)
        await self.repo.delete_task(task_id)

        return {
            "message": f"Successfully applied {len(created_timetables)} timetable entries."
        }

    async def delete_generation_task(self, task_id: int) -> dict:
        await self.get_generation_task(task_id)
        await self.repo.delete_drafts_by_task(task_id)
        await self.repo.delete_task(task_id)
        return {"message": "Task and associated drafts deleted"}

    # ═══════════════════════════════════════════════════════════
    # ROOMS
    # ═══════════════════════════════════════════════════════════

    async def get_all_rooms(self, active_only: bool = False) -> list[dict]:
        return await self.repo.get_all_rooms(active_only=active_only)

    async def get_room(self, room_id: int) -> dict:
        room = await self.repo.get_room_by_id(room_id)
        if not room:
            raise RoomNotFoundError()
        return room

    async def create_room(self, data: RoomCreate, actor_id: int | None = None) -> dict:
        room = await self.repo.create_room(
            name=data.name,
            capacity=data.capacity,
            room_type=data.room_type.value,
            building=data.building,
            floor=data.floor,
            is_active=data.is_active,
        )
        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.CREATE,
            entity_name="room",
            entity_id=room["id"],
            old_value=None,
            new_value=dict(room),
        )
        return room

    async def update_room(
        self, room_id: int, data: RoomUpdate, actor_id: int | None = None
    ) -> dict:
        current = await self.get_room(room_id)
        kwargs = {}
        if data.name is not None:
            kwargs["name"] = data.name
        if data.capacity is not None:
            kwargs["capacity"] = data.capacity
        if data.room_type is not None:
            kwargs["room_type"] = data.room_type.value
        if data.building is not None:
            kwargs["building"] = data.building
        if data.floor is not None:
            kwargs["floor"] = data.floor
        if data.is_active is not None:
            kwargs["is_active"] = data.is_active

        updated = await self.repo.update_room(room_id, **kwargs)
        if not updated:
            from app.core.exceptions import AppError
            raise AppError("Room could not be fetched after update")

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.UPDATE,
            entity_name="room",
            entity_id=room_id,
            old_value=dict(current),
            new_value=dict(updated),
        )
        return updated

    async def delete_room(self, room_id: int, actor_id: int | None = None) -> dict:
        current = await self.get_room(room_id)
        deleted = await self.repo.delete_room(room_id)
        if not deleted:
            from app.core.exceptions import AppError

            raise AppError("Failed to delete room")
        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.DELETE,
            entity_name="room",
            entity_id=room_id,
            old_value=dict(current),
            new_value=None,
        )
        return {"message": f"Room ID={room_id} deleted"}

    # ═══════════════════════════════════════════════════════════
    # TIME SLOTS
    # ═══════════════════════════════════════════════════════════

    async def get_time_slots(self) -> list[dict]:
        return await self.repo.get_all_time_slots()

    # ═══════════════════════════════════════════════════════════
    # TEACHER AVAILABILITY
    # ═══════════════════════════════════════════════════════════

    async def get_teacher_availability(self, user_id: int) -> list[dict]:
        return await self.repo.get_teacher_availabilities(user_id)

    async def set_teacher_availability(
        self, user_id: int, day: str, slot_number: int
    ) -> dict:
        return await self.repo.set_teacher_availability(user_id, day, slot_number)

    async def bulk_set_teacher_availability(
        self, user_id: int, entries: list[dict]
    ) -> dict:
        count = await self.repo.bulk_set_teacher_availability(user_id, entries)
        return {"message": f"Set {count} availability slots for teacher {user_id}"}

    async def delete_teacher_availability(
        self, user_id: int, day: str | None = None
    ) -> dict:
        count = await self.repo.delete_teacher_availability(user_id, day)
        return {"message": f"Deleted {count} availability entries"}

    # ═══════════════════════════════════════════════════════════
    # LECTURE GROUPS
    # ═══════════════════════════════════════════════════════════

    async def create_lecture_group(
        self,
        name: str,
        subject_id: int,
        semester: str | None,
        assignment_ids: list[int],
    ) -> dict:
        return await self.repo.create_lecture_group(
            name, subject_id, semester, assignment_ids
        )

    async def get_all_lecture_groups(self) -> list[dict]:
        return await self.repo.get_all_lecture_groups()

    async def get_lecture_group(self, group_id: int) -> dict:
        group = await self.repo.get_lecture_group(group_id)
        if not group:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Lecture group not found")
        return group

    async def delete_lecture_group(self, group_id: int) -> dict:
        await self.get_lecture_group(group_id)
        await self.repo.delete_lecture_group(group_id)
        return {"message": f"Lecture group ID={group_id} deleted"}
