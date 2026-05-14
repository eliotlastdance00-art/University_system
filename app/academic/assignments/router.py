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
    summary        = "Täze bellemek",
    description    = "Admin mugallyma ders belleýär"
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
    summary        = "Ähli bellemeler",
    description    = "Admin ähli bellemeçileri görýär"
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
    summary        = "Birini al",
    description    = "ID boýunça bellemäni al"
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
    summary        = "Bellemäni üýtget",
    description    = "Admin bellemäni üýtgedýär"
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
    summary     = "Bellemäni poz",
    description = "Admin bellemäni pozýar"
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
    summary        = "Semester boýunça",
    description    = "Şol semestrdäki ähli bellemeler"
)
async def get_by_semester(
    semester:     str,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.get_by_semester(semester)


@router.get(
    "/group/{group_id}",
    response_model = list[AssignmentDetailResponse],
    summary        = "Topar boýunça",
    description    = "Şol toparyň ähli dersleri"
)
async def get_by_group(
    group_id:     int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.get_by_group(group_id)


# ─── TEACHER ────────────────────────────────────────────────

@router.get(
    "/my",
    response_model = list[AssignmentDetailResponse],
    summary        = "Meniň derslerim",
    description    = "Mugallymyň ähli dersleri"
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
    summary        = "Meniň şol semestrdäki derslerim",
    description    = "Mugallymyň şol semestrdäki dersleri"
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
    summary        = "Meniň doly tertibim",
    description    = "Mugallymyň ähli dersleri + wagt tertibi"
)
async def get_my_schedule(
    current_user: dict = Depends(teacher_required),
    conn:Connection=Depends(get_db)
):
    service = AssignmentService(conn)
    return await service.get_teacher_schedule(
        current_user["id"]
    )