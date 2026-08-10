from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.academic.attendance.schemas import (
    AttendanceBulkCreate,
    AttendanceResponse,
    AttendanceStatsResponse,
    AttendanceUpdate,
)
from app.academic.attendance.service import AttendanceService
from app.core.database import get_db
from app.core.dependencies import (
    admin_or_student,
    admin_or_teacher,
    admin_required,
    get_current_user,
    get_user_id,
)

router = APIRouter()

AdminOrTeacherUser = Annotated[dict, Depends(admin_or_teacher)]
AdminUser = Annotated[dict, Depends(admin_required)]
AdminOrStudent = Annotated[dict, Depends(admin_or_student)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
DbConnection = Annotated[Connection, Depends(get_db)]


# ─── TEACHER ────────────────────────────────────────────────


@router.get(
    "/lesson/{lesson_id}/students",
    response_model=list[AttendanceResponse],
    summary="Lesson students",
    description="Returns the list of students for a given lesson"
    ". This endpoint is used at the start of a lesson to get the list of students who are supposed to attend.",
)
async def get_students(
    lesson_id: int,
    current_user: AdminOrTeacherUser,
    conn: DbConnection,
):
    service = AttendanceService(conn)
    return await service.get_students(lesson_id, current_user)


@router.post(
    "/lesson/{lesson_id}",
    response_model=list[AttendanceResponse],
    summary="Bulk create attendance records",
    description="This endpoint allows teachers to bulk create attendance records for a lesson. "
    "The request body should contain a list of student IDs and their corresponding attendance status. ",
)
async def bulk_create(
    lesson_id: int,
    data: AttendanceBulkCreate,
    current_user: AdminOrTeacherUser,
    conn: DbConnection,
):
    service = AttendanceService(conn)
    return await service.bulk_create(lesson_id, data, current_user)


@router.put(
    "/{id}",
    response_model=AttendanceResponse,
    summary="Correct attendance record",
    description="This endpoint allows teachers to correct an attendance record. ",
)
async def update_attendance(
    id: int,
    data: AttendanceUpdate,
    current_user: AdminOrTeacherUser,
    conn: DbConnection,
):
    service = AttendanceService(conn)
    return await service.update(id, data, current_user)


@router.get(
    "/lesson/{lesson_id}",
    response_model=list[AttendanceResponse],
    summary="Lesson attendance",
)
async def get_by_lesson(
    lesson_id: int,
    current_user: AdminOrTeacherUser,
    conn: DbConnection,
):
    service = AttendanceService(conn)
    return await service.get_by_lesson(lesson_id)


@router.get(
    "/lesson/{lesson_id}/stats",
    response_model=AttendanceStatsResponse,
    summary="Lesson attendance statistics",
)
async def get_lesson_stats(
    lesson_id: int,
    current_user: AdminOrTeacherUser,
    conn: DbConnection,
):
    service = AttendanceService(conn)
    return await service.get_lesson_stats(lesson_id)


# ─── ADMIN ──────────────────────────────────────────────────


@router.get(
    "/student/{student_id}",
    response_model=list[AttendanceResponse],
    summary="Student attendance records",
)
async def get_by_student(
    student_id: int,
    current_user: AdminOrStudent,
    conn: DbConnection,
):
    service = AttendanceService(conn)
    return await service.get_by_student(student_id)


@router.get(
    "/my/stats",
    response_model=AttendanceStatsResponse,
    summary="My attendance statistics",
    description="Student fetches their own attendance stats using JWT sub field.",
)
async def get_my_stats(
    current_user: CurrentUser,
    conn: DbConnection,
):
    service = AttendanceService(conn)
    return await service.get_student_stats(get_user_id(current_user))


@router.get(
    "/student/{student_id}/stats",
    response_model=AttendanceStatsResponse,
    summary="Student attendance statistics",
)
async def get_student_stats(
    student_id: int,
    current_user: AdminOrStudent,
    conn: DbConnection,
):
    service = AttendanceService(conn)
    return await service.get_student_stats(student_id)


@router.get(
    "/group/{section_id}/stats",
    response_model=list,
    summary="Group attendance statistics",
    description="Returns the attendance statistics for all students in a group.",
)
async def get_group_stats(
    section_id: int,
    current_user: AdminUser,
    conn: DbConnection,
):
    service = AttendanceService(conn)
    return await service.get_group_stats(section_id)
