from datetime import date
from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.academic.lessons.schemas import (
    LessonCancel,
    LessonResponse,
    LessonStatsResponse,
)
from app.academic.lessons.service import LessonService
from app.core.database import get_db
from app.core.dependencies import admin_required, teacher_required

router = APIRouter()

AdminUser = Annotated[dict, Depends(admin_required)]
DbConnection = Annotated[Connection, Depends(get_db)]
Teacher = Annotated[dict, Depends(teacher_required)]
# ─── ADMIN ──────────────────────────────────────────────────


@router.get(
    "/",
    response_model=list[LessonResponse],
    summary="Ähli sapaklar",
)
async def get_all(current_user: AdminUser, conn: DbConnection):
    service = LessonService(conn)
    return await service.get_all()


@router.get(
    "/date/{date}",
    response_model=list[LessonResponse],
    summary="THAT LESSONS BY DATE",
)
async def get_by_date(
    date: date,
    current_user: AdminUser,
    conn: DbConnection,
):
    service = LessonService(conn)
    return await service.get_by_date(date)


@router.get(
    "/timetable/{timetable_id}",
    response_model=list[LessonResponse],
    summary="THAT LESSONS BY TIMETABLE",
)
async def get_by_timetable(
    timetable_id: int,
    current_user: AdminUser,
    conn: DbConnection,
):
    service = LessonService(conn)
    return await service.get_by_timetable(timetable_id)


# ─── TEACHER ────────────────────────────────────────────────


@router.post(
    "/{timetable_id}/start",
    response_model=LessonResponse,
    summary="Start Lesson",
    description="Teacher starts the lesson — date is set automatically",
)
async def start_lesson(
    timetable_id: int,
    current_user: Teacher,
    conn: DbConnection,
):
    service = LessonService(conn)
    return await service.start(timetable_id, current_user)


@router.put(
    "/{id}/cancel",
    response_model=LessonResponse,
    summary="Cancel Lesson",
)
async def cancel_lesson(
    id: int,
    data: LessonCancel,
    current_user: Teacher,
    conn: DbConnection,
):
    service = LessonService(conn)
    return await service.cancel(id, data, current_user)


@router.get(
    "/my/history",
    response_model=list[LessonResponse],
    summary="My Lesson History",
)
async def get_my_history(current_user: Teacher, conn: DbConnection):
    service = LessonService(conn)
    return await service.get_my_history(current_user)


@router.get(
    "/my/stats",
    response_model=LessonStatsResponse,
    summary="My Lesson Stats",
)
async def get_my_stats(current_user: Teacher, conn: DbConnection):
    service = LessonService(conn)
    return await service.get_my_stats(current_user)
