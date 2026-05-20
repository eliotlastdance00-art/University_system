from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.core.database import get_db

from .schemas import (
    DepartmentCreate,
    DepartmentPaginationResponse,
    DepartmentResponse,
    DepartmentUpdate,
)
from .service import DepartmentService

router = APIRouter()


# router.py
@router.get("/next", response_model=DepartmentPaginationResponse)
async def read_departments_next(
    last_id: int, limit: int, conn: Connection = Depends(get_db)
):
    service = DepartmentService(conn)
    return await service.department_incremental(last_id, limit)


@router.get("{faculty_id}", response_model=list[DepartmentResponse])
async def get_all_departments(faculty_id: int, conn: Connection = Depends(get_db)):
    service = DepartmentService(conn)
    return await service.department_all_faculty(faculty_id)


@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_id_department(department_id: int, conn: Connection = Depends(get_db)):
    service = DepartmentService(conn)
    return await service.department_id_get(department_id)


@router.post("/", response_model=dict)
async def create_new_department(
    data: DepartmentCreate, conn: Connection = Depends(get_db)
):
    service = DepartmentService(conn)
    return await service.deparment_create(data)


@router.delete("/", response_model=dict)
async def delete_id_department(department_id: int, conn: Connection = Depends(get_db)):
    service = DepartmentService(conn)
    return await service.department_delete(department_id)


@router.put("/", response_model=dict)
async def put_department(
    department_id: int, data: DepartmentUpdate, conn: Connection = Depends(get_db)
):
    service = DepartmentService(conn)
    return await service.department_update(department_id, data)
