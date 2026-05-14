from fastapi import APIRouter, Depends
from typing import List
from aiomysql import Connection
from app.core.database import get_db
from app.academic.timetable.service import TimetableService
from app.academic.timetable.schemas import (
    TimetableCreate,
    TimetableDetailResponse,
    TimetableResponse,
    TimetableUpdate,
    TimetableEnum,
    GroupResponse
    
)
from app.core.dependencies import (
    admin_required,
    teacher_required
)

router  = APIRouter()



# ─── ADMIN ──────────────────────────────────────────────────

@router.post(
    "",
    response_model = TimetableResponse,
    summary        = "Create timetable",
    description    = "Admin or department head can create timetable"
)
async def create_timetable(
    data:         TimetableCreate,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
)->dict:
    service = TimetableService(conn)
    return await service.create(data)


@router.get(
    "",
    response_model=List[TimetableDetailResponse],
    summary="Get all timetables",
    description="Only admin can see all timetables"
)
async def get_all_timetables(
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
)->dict:
    service = TimetableService(conn)
    return await service.get_all() 



@router.get(
    "/group/{group_id}",
    response_model=List[TimetableResponse],
    summary="Get group  week timetable",
    description="Student for week timetable"
)
async def get_group_timetable_week(
    group_id: int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
)->dict:
    service = TimetableService(conn)
    return await service.get_group(group_id)            




@router.get(
    "/group/{group_id}/day/{day}",
    response_model=List[GroupResponse],
    summary="Get group day timetable",
    description="Student for timetable"
)
async def get_group_day_timetable(
    day: TimetableEnum,
    group_id: int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
)->list[dict]:
    service = TimetableService(conn)
    return await service.get_day_group(day, group_id)



@router.get(
    "/teacher/my",
    response_model=TimetableResponse,
    summary="Get teacher timetable",
    description="Teacher for timetable"
)
async def get_teacher_timetable(
    current_user: dict = Depends(teacher_required),
    conn:Connection=Depends(get_db)
):
    service = TimetableService(conn)
    return await service.get_teacher_timetable(current_user["id"])


@router.get(
    "/teacher/my/day/{day}",
    response_model=TimetableResponse,
    summary="Get teacher day timetable",
    description="Teacher for timetable"
)
async def get_teacher_day_timetable(
    day: TimetableEnum,
    current_user: dict = Depends(teacher_required),
    conn:Connection=Depends(get_db)
):
    service = TimetableService(conn)
    return await service.get_teacher_timetable_day(current_user["id"], day)


@router.put(
    "/{id}",
    response_model=TimetableDetailResponse,
    summary="Update timetable",
    description="Admin or department head   can update timetable"
)
async def update_timetable(
    id: int,
    data: TimetableUpdate,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = TimetableService(conn)
    return await service.update(id, data)         


@router.delete(
    "/{id}",
    summary="Delete timetable",
    description="Admin or department head can delete timetable"
)
async def delete_timetable(
    id: int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
):
    service = TimetableService(conn)
    return await service.delete(id)