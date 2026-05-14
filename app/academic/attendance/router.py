from fastapi import APIRouter, Depends
from aiomysql import Connection
from app.core.database import get_db
from app.academic.attendance.service import AttendanceService
from app.academic.attendance.schemas import (
    AttendanceResponse,
    AttendanceBulkCreate,
    AttendanceUpdate,
    AttendanceStatsResponse
)
from app.core.dependencies import (
    admin_required,
    admin_or_teacher
)

router = APIRouter()



# ─── TEACHER ────────────────────────────────────────────────

@router.get(
    "/lesson/{lesson_id}/students",
    response_model = list[AttendanceResponse],
    summary = "Sapagyň studentleri",
    description = "Mugallym sapak başladanda "
                     "studentleri görýär"
)
async def get_students(
    lesson_id: int,
    current_user: dict = Depends(admin_or_teacher),
    conn:Connection=Depends(get_db)
):
    service = AttendanceService(conn)
    return await service.get_students(
        lesson_id, current_user
    )


@router.post(
    "/lesson/{lesson_id}",
    response_model = list[AttendanceResponse],
    summary = "Gatnaw bellemek",
    description = "Mugallym ähli studentleriň "
                     "gatnawy bir gezekde belleýär"
)
async def bulk_create(
    lesson_id: int,
    data: AttendanceBulkCreate,
    current_user: dict = Depends(admin_or_teacher),
    conn:Connection=Depends(get_db)
):
    service = AttendanceService(conn)
    return await service.bulk_create(
        lesson_id, data, current_user
    )


@router.put(
    "/{id}",
    response_model = AttendanceResponse,
    summary = "Gatnaw üýtget",
    description = "Ýalňyşlyk bilen ýazylan gatnawy üýtget"
)
async def update_attendance(
    id: int,
    data: AttendanceUpdate,
    current_user: dict = Depends(admin_or_teacher),
    conn:Connection=Depends(get_db)
):
    service = AttendanceService(conn)
    return await service.update(id, data, current_user)


@router.get(
    "/lesson/{lesson_id}",
    response_model = list[AttendanceResponse],
    summary = "Sapagyň gatnawy",
)
async def get_by_lesson(
    lesson_id: int,
    current_user: dict = Depends(admin_or_teacher),
    conn:Connection=Depends(get_db)
):
    service = AttendanceService(conn)
    return await service.get_by_lesson(lesson_id)


@router.get(
    "/lesson/{lesson_id}/stats",
    response_model = AttendanceStatsResponse,
    summary = "Sapagyň gatnaw statistikasy",
)
async def get_lesson_stats(
    lesson_id: int,
    current_user: dict = Depends(admin_or_teacher),
    conn:Connection=Depends(get_db)
):
    service = AttendanceService(conn)
    return await service.get_lesson_stats(lesson_id)


# ─── ADMIN ──────────────────────────────────────────────────

@router.get(
    "/student/{student_id}",
    response_model = list[AttendanceResponse],
    summary = "Studentiň ähli gatnawy",
)
async def get_by_student(
    student_id: int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = AttendanceService(conn)
    return await service.get_by_student(student_id)


@router.get(
    "/student/{student_id}/stats",
    response_model = AttendanceStatsResponse,
    summary = "Studentiň gatnaw statistikasy",
)
async def get_student_stats(
    student_id: int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = AttendanceService(conn)
    return await service.get_student_stats(student_id)


@router.get(
    "/group/{group_id}/stats",
    response_model = list,
    summary = "Toparyň gatnaw statistikasy",
    description = "Ähli studentleriň gatnawy "
                     "göterim boýunça"
)
async def get_group_stats(
    group_id: int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = AttendanceService(conn)
    return await service.get_group_stats(group_id)