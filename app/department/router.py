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


@router.get("/{id}", response_model=DepartmentResponse)
async def get_id_department(id: int, conn: Connection = Depends(get_db)):
    service = DepartmentService(conn)
    return await service.department_id_get(id)


@router.post("/", response_model=dict)
async def create_new_department(
    data: DepartmentCreate, conn: Connection = Depends(get_db)
):
    service = DepartmentService(conn)
    return await service.deparment_create(data)


@router.delete("/{id}", response_model=dict)
async def delete_id_department(id: int, conn: Connection = Depends(get_db)):
    service = DepartmentService(conn)
    return await service.department_delete(id)


@router.put("/{id}", response_model=dict)
async def put_department(
    id: int, data: DepartmentUpdate, conn: Connection = Depends(get_db)
):
    service = DepartmentService(conn)
    return await service.department_update(id, data)



@router.get("/{id}/programs",response_model=list[dict])
async def get_department_programs(id:int,conn:Connection=Depends(get_db)):
    service=DepartmentService(conn)
    return await service.get_department_programs(id)




@router.get("/{id}/teachers",response_model=list[dict])
async def get_department_teacher(id:int,conn:Connection=Depends(get_db)):
    service=DepartmentService(conn)
    return await service.get_department_teachers(id)



@router.get("/{id}/teachers",response_model=list[dict])
async def get_department_students(id:int,conn:Connection=Depends(get_db)):
    service=DepartmentService(conn)
    return await service.get_department_students(id)

