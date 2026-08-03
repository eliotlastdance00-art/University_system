from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.academic.timetable.schemas import (
    GroupResponse,
    TimetableCreate,
    TimetableDetailResponse,
    TimetableEnum,
    TimetableResponse,
    TimetableUpdate,
)
from app.academic.timetable.service import TimetableService
from app.core.database import get_db
from app.core.dependencies import admin_or_student, admin_required, teacher_required

router = APIRouter()

CurrentUser = Annotated[dict, Depends(admin_required)]
CurrentTeacher = Annotated[dict, Depends(teacher_required)]
AdminOrStudent = Annotated[dict, Depends(admin_or_student)]
DbConnection = Annotated[Connection, Depends(get_db)]


# ─── ADMIN ──────────────────────────────────────────────────


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
    return await service.create(data, actor_id=current_user["sub"])


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


# ─── TEACHER ────────────────────────────────────────────────


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
    return await service.get_teacher_timetable(current_user["id"])


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
    return await service.get_teacher_timetable_day(current_user["id"], day)


# ─── ADMIN: UPDATE / DELETE ────────────────────────────────


@router.put(
    "/{id}",
    response_model=list[TimetableResponse],
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
    return await service.update(id, data)


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
    return await service.delete(id)
