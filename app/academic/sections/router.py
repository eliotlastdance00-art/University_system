from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.academic.attendance.service import AttendanceService
from app.academic.timetable.service import TimetableService
from app.core.database import get_db

from .schemas import SectionCreate, UpdateSection
from .service import SectionService

router = APIRouter()

DbConnection = Annotated[Connection, Depends(get_db)]


@router.post("/", response_model=dict)
async def create_section(data: SectionCreate, conn: DbConnection):
    service = SectionService(conn)
    return await service.create_section(data)


@router.get("/", response_model=list[dict])
async def get_all_sections(
    conn: DbConnection, skip: int = 0, limit: int = 10
):
    service = SectionService(conn)
    return await service.get_all_sections(skip, limit)


@router.get("/{id}", response_model=dict)
async def get_section_by_id(id: int, conn: DbConnection):
    service = SectionService(conn)
    return await service.get_section_by_id(id)


@router.put("/{id}", response_model=dict)
async def update_section(
    id: int, data: UpdateSection, conn: DbConnection
):
    service = SectionService(conn)
    return await service.update_section(id, data)


@router.delete("/{id}", response_model=dict)
async def delete_section(id: int, conn: DbConnection):
    service = SectionService(conn)
    return await service.delete_section(id)


@router.get("/{id}/students", response_model=list[dict])
async def get_section_student(id: int, conn: DbConnection):
    service = SectionService(conn)
    return await service.get_section_student(id)


@router.get("/{id}/timetable")
async def get_section_timetable(id: int, conn: DbConnection):
    ttable_service = TimetableService(conn)
    return await ttable_service.get_group(id)


@router.get("/{id}/attendance/stats", response_model=list[dict])
async def get_section_attendance_stats(id: int, conn: DbConnection):
    service = AttendanceService(conn)
    return await service.get_group_stats(id)
