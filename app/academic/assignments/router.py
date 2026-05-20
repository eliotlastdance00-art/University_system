from fastapi import APIRouter, Depends
from aiomysql import Connection
from app.core.database import get_db
from app.academic.assignments.service import AssignmentService
from app.academic.assignments.schemas import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentDetailResponse,
    TeacherScheduleResponse
)
from app.core.dependencies import (
    admin_required,
    teacher_required
)

router  = APIRouter()



# ─── ADMIN ──────────────────────────────────────────────────

@router.post(
    "",
    response_model = AssignmentDetailResponse,
    summary        = "New assignment",
    description    = "Admin creates a new assignment"
)
async def create_assignment(
    data:         AssignmentCreate,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
)-> dict:
    service = AssignmentService(conn)
    return await service.create(data)


@router.get(
    "",
    response_model = list[AssignmentDetailResponse],
    summary        = "All assignments",
    description    = "Admin sees all assignments"
)
async def get_all_assignments(
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.get_all()


@router.get(
    "/{id}",
    response_model = AssignmentDetailResponse,
    summary        = "Get assignment by ID",
    description    = "Get assignment by ID"
)
async def get_assignment(
    id:           int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)

):
    service = AssignmentService(conn)
    return await service.get_by_id(id)


@router.put(
    "/{id}",
    response_model = AssignmentDetailResponse,
    summary        = "Change assignment",
    description    = "Admin changes an assignment"
)
async def update_assignment(
    id:           int,
    data:         AssignmentUpdate,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.update(id, data)


@router.delete(
    "/{id}",
    summary     = "Delete assignment",
    description = "Admin deletes an assignment"
)
async def delete_assignment(
    id:           int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.delete(id)


@router.get(
    "/semester/{semester}",
    response_model = list[AssignmentDetailResponse],
    summary        = "Get assignments by semester",
    description    = "Get all assignments for a specific semester"
)
async def get_by_semester(
    semester:     str,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.get_by_semester(semester)


@router.get(
    "/group/{section_id}",
    response_model = list[AssignmentDetailResponse],
    summary        = "Get assignments by group",
    description    = "Get all assignments for a specific group"
)
async def get_by_group(
    section_id:     int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.get_by_group(section_id)


# ─── TEACHER ────────────────────────────────────────────────

@router.get(
    "/my",
    response_model = list[AssignmentDetailResponse],
    summary        = "Get my assignments",
    description    = "Get all assignments for the current teacher"
)
async def get_my_assignments(
    current_user: dict = Depends(teacher_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.get_by_teacher(
        current_user["id"]
    )


@router.get(
    "/my/semester/{semester}",
    response_model = list[AssignmentDetailResponse],
    summary        = "Get my assignments for a specific semester",
    description    = "Get all assignments for the current teacher in a specific semester"
)
async def get_my_assignments_by_semester(
    semester:     str,
    current_user: dict = Depends(teacher_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.get_by_teacher_semester(
        user_id  = current_user["id"],
        semester = semester
    )


@router.get(
    "/my/schedule",
    response_model = list[TeacherScheduleResponse],
    summary        = "Get my schedule",
    description    = "Get all classes and time slots for the current teacher"
)
async def get_my_schedule(
    current_user: dict = Depends(teacher_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.get_teacher_schedule(
        current_user["id"]
    )