from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.core.dependencies import admin_required

from .schemas import (
    DepartmentCreate,
    DepartmentPaginationResponse,
    DepartmentResponse,
    DepartmentUpdate,
)
from .service import DepartmentService

router = APIRouter()

AdminUser = Annotated[dict, Depends(admin_required)]
DbConnection = Annotated[Connection, Depends(get_db)]


@router.get("/next", response_model=DepartmentPaginationResponse)
async def read_departments_next(
    last_id: int, limit: int, current_user: AdminUser, conn: DbConnection
):
    service = DepartmentService(conn)
    return await service.get_departments_paginated(last_id, limit)


@router.get("/{id}", response_model=DepartmentResponse)
async def get_id_department(id: int, current_user: AdminUser, conn: DbConnection):
    service = DepartmentService(conn)
    return await service.get_department_by_id(id)


@router.post("/", response_model=dict)
async def create_new_department(
    data: DepartmentCreate, current_user: AdminUser, conn: DbConnection
):
    service = DepartmentService(conn)
    return await service.create_department(data, actor_id=current_user.get("sub"))


@router.delete("/{id}", response_model=dict)
async def delete_id_department(id: int, current_user: AdminUser, conn: DbConnection):
    service = DepartmentService(conn)
    return await service.delete_department(id, actor_id=current_user.get("sub"))


@router.put("/{id}", response_model=dict)
async def put_department(
    id: int, data: DepartmentUpdate, current_user: AdminUser, conn: DbConnection
):
    service = DepartmentService(conn)
    return await service.update_department(id, data, actor_id=current_user.get("sub"))


@router.get("/{id}/programs", response_model=list[dict])
async def get_department_programs(id: int, current_user: AdminUser, conn: DbConnection):
    service = DepartmentService(conn)
    return await service.get_department_programs(id)


@router.get("/{id}/teachers", response_model=list[dict])
async def get_department_teacher(id: int, current_user: AdminUser, conn: DbConnection):
    service = DepartmentService(conn)
    return await service.get_department_teachers(id)


@router.get("/{id}/students", response_model=list[dict])
async def get_department_students(id: int, current_user: AdminUser, conn: DbConnection):
    service = DepartmentService(conn)
    return await service.get_department_students(id)
