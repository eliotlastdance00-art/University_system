from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends, Query

from app.academic.timetable.schemas import (
    GroupResponse,
    LectureGroupCreate,
    LectureGroupResponse,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
    TeacherAvailabilityBulkCreate,
    TeacherAvailabilityCreate,
    TeacherAvailabilityResponse,
    TimeSlotResponse,
    TimetableCreate,
    TimetableDetailResponse,
    TimetableDraftResponse,
    TimetableEnum,
    TimetableResponse,
    TimetableTaskCreate,
    TimetableTaskResponse,
    TimetableUpdate,
)
from app.academic.timetable.service import TimetableService
from app.core.database import get_db
from app.core.dependencies import (
    admin_or_student,
    admin_required,
    get_user_id,
    teacher_required,
)

router = APIRouter()

CurrentUser = Annotated[dict, Depends(admin_required)]
CurrentTeacher = Annotated[dict, Depends(teacher_required)]
AdminOrStudent = Annotated[dict, Depends(admin_or_student)]
DbConnection = Annotated[Connection, Depends(get_db)]


# ═══════════════════════════════════════════════════════════════
# TIMETABLE CORE
# ═══════════════════════════════════════════════════════════════


@router.post(
    "",
    response_model=TimetableResponse,
    summary="Create timetable",
    description="Admin or department head can create timetable",
)
async def create_timetable(
    data: TimetableCreate,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.create(data, actor_id=get_user_id(current_user))


@router.get(
    "",
    response_model=list[TimetableDetailResponse],
    summary="Get all timetables",
    description="Only admin can see all timetables",
)
async def get_all_timetables(
    current_user: CurrentUser,
    conn: DbConnection,
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_all()


@router.get(
    "/group/{section_id}",
    response_model=list[TimetableResponse],
    summary="Get group week timetable",
    description="Student for week timetable",
)
async def get_group_timetable_week(
    section_id: int,
    current_user: AdminOrStudent,
    conn: DbConnection,
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_group(section_id)


@router.get(
    "/group/{section_id}/day/{day}",
    response_model=list[GroupResponse],
    summary="Get group day timetable",
    description="Student for timetable",
)
async def get_group_day_timetable(
    day: TimetableEnum,
    section_id: int,
    current_user: AdminOrStudent,
    conn: DbConnection,
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_day_group(day, section_id)


@router.get(
    "/teacher/my",
    response_model=list[TimetableResponse],
    summary="Get teacher timetable",
    description="Teacher for timetable",
)
async def get_teacher_timetable(
    current_user: CurrentTeacher,
    conn: DbConnection,
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_teacher_timetable(get_user_id(current_user))


@router.get(
    "/teacher/my/day/{day}",
    response_model=list[TimetableResponse],
    summary="Get teacher day timetable",
    description="Teacher for timetable",
)
async def get_teacher_day_timetable(
    day: TimetableEnum,
    current_user: CurrentTeacher,
    conn: DbConnection,
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_teacher_timetable_day(get_user_id(current_user), day)


@router.put(
    "/{id}",
    response_model=dict,  # Original returns list[TimetableResponse] or dict depending on implementation
    summary="Update timetable",
    description="Admin or department head can update timetable",
)
async def update_timetable(
    id: int,
    data: TimetableUpdate,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.update(id, data, actor_id=get_user_id(current_user))


@router.delete(
    "/{id}",
    summary="Delete timetable",
    description="Admin or department head can delete timetable",
)
async def delete_timetable(
    id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.delete(id, actor_id=get_user_id(current_user))


# ═══════════════════════════════════════════════════════════════
# GENERATION TASKS
# ═══════════════════════════════════════════════════════════════


@router.post(
    "/tasks/generate",
    response_model=TimetableTaskResponse,
    summary="Start timetable generation task",
    description="Starts an async worker task to generate the timetable using Advanced CSP Algorithm",
)
async def generate_timetable(
    data: TimetableTaskCreate,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.create_generation_task(
        actor_id=get_user_id(current_user), parameters=data.parameters or {}
    )


@router.get(
    "/tasks",
    response_model=list[TimetableTaskResponse],
    summary="Get all generation tasks",
)
async def get_all_tasks(
    current_user: CurrentUser,
    conn: DbConnection,
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_generation_tasks()


@router.get(
    "/tasks/{task_id}",
    response_model=TimetableTaskResponse,
    summary="Get task status",
)
async def get_task_status(
    task_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.get_generation_task(task_id)


@router.get(
    "/tasks/{task_id}/drafts",
    response_model=list[TimetableDraftResponse],
    summary="Get drafts for a task",
)
async def get_task_drafts(
    task_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_task_drafts(task_id)


@router.post(
    "/tasks/{task_id}/apply",
    summary="Apply task drafts to timetable",
)
async def apply_task_drafts(
    task_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.apply_task_drafts(task_id, actor_id=get_user_id(current_user))


@router.delete(
    "/tasks/{task_id}",
    summary="Delete task and drafts",
)
async def delete_task_and_drafts(
    task_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.delete_generation_task(task_id)


# ═══════════════════════════════════════════════════════════════
# ROOMS
# ═══════════════════════════════════════════════════════════════


@router.get(
    "/rooms",
    response_model=list[RoomResponse],
    summary="Get all rooms",
)
async def get_rooms(
    current_user: CurrentUser,
    conn: DbConnection,
    active_only: bool = Query(False, description="Filter only active rooms"),
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_all_rooms(active_only=active_only)


@router.post(
    "/rooms",
    response_model=RoomResponse,
    summary="Create room",
)
async def create_room(
    data: RoomCreate,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.create_room(data, actor_id=get_user_id(current_user))


@router.get(
    "/rooms/{room_id}",
    response_model=RoomResponse,
    summary="Get room by ID",
)
async def get_room(
    room_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.get_room(room_id)


@router.put(
    "/rooms/{room_id}",
    response_model=RoomResponse,
    summary="Update room",
)
async def update_room(
    room_id: int,
    data: RoomUpdate,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.update_room(room_id, data, actor_id=get_user_id(current_user))


@router.delete(
    "/rooms/{room_id}",
    summary="Delete room",
)
async def delete_room(
    room_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.delete_room(room_id, actor_id=get_user_id(current_user))


# ═══════════════════════════════════════════════════════════════
# TIME SLOTS
# ═══════════════════════════════════════════════════════════════


@router.get(
    "/time-slots",
    response_model=list[TimeSlotResponse],
    summary="Get all time slots",
)
async def get_time_slots(
    current_user: CurrentUser,
    conn: DbConnection,
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_time_slots()


# ═══════════════════════════════════════════════════════════════
# TEACHER AVAILABILITY
# ═══════════════════════════════════════════════════════════════


@router.get(
    "/availability/{user_id}",
    response_model=list[TeacherAvailabilityResponse],
    summary="Get teacher availability",
)
async def get_teacher_availability(
    user_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_teacher_availability(user_id)


@router.post(
    "/availability",
    response_model=TeacherAvailabilityResponse,
    summary="Set single availability slot for teacher",
)
async def set_teacher_availability(
    data: TeacherAvailabilityCreate,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.set_teacher_availability(data.user_id, data.day.value, data.slot_number)


@router.post(
    "/availability/bulk",
    summary="Bulk set teacher availability",
)
async def bulk_set_teacher_availability(
    data: TeacherAvailabilityBulkCreate,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.bulk_set_teacher_availability(data.user_id, data.availabilities)


@router.delete(
    "/availability/{user_id}",
    summary="Delete teacher availability",
)
async def delete_teacher_availability(
    user_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
    day: TimetableEnum | None = Query(None, description="Specific day to delete, or all if omitted"),  # noqa: B008
) -> dict:
    service = TimetableService(conn)
    return await service.delete_teacher_availability(user_id, day.value if day else None)


# ═══════════════════════════════════════════════════════════════
# LECTURE GROUPS
# ═══════════════════════════════════════════════════════════════


@router.get(
    "/lecture-groups",
    response_model=list[LectureGroupResponse],
    summary="Get all lecture groups",
)
async def get_lecture_groups(
    current_user: CurrentUser,
    conn: DbConnection,
) -> list[dict]:
    service = TimetableService(conn)
    return await service.get_all_lecture_groups()


@router.post(
    "/lecture-groups",
    response_model=LectureGroupResponse,
    summary="Create lecture group (combine sections)",
)
async def create_lecture_group(
    data: LectureGroupCreate,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.create_lecture_group(
        name=data.name,
        subject_id=data.subject_id,
        semester=data.semester,
        assignment_ids=data.assignment_ids,
    )


@router.get(
    "/lecture-groups/{group_id}",
    response_model=LectureGroupResponse,
    summary="Get lecture group by ID",
)
async def get_lecture_group(
    group_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.get_lecture_group(group_id)


@router.delete(
    "/lecture-groups/{group_id}",
    summary="Delete lecture group",
)
async def delete_lecture_group(
    group_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = TimetableService(conn)
    return await service.delete_lecture_group(group_id)
