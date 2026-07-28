from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.core.database import get_db

from .schemas import ProgramCreate, ProgramUpdate
from .service import ProgramService

router = APIRouter()

DbConnection = Annotated[Connection, Depends(get_db)]


@router.post("/")
async def create(data: ProgramCreate, conn: DbConnection):
    service = ProgramService(conn)
    return await service.create(data)


@router.put("/{id}")
async def update(id: int, data: ProgramUpdate, conn: DbConnection):
    service = ProgramService(conn)
    return await service.update(id, data)


@router.get("/")
async def get_all_program(conn: DbConnection):
    service = ProgramService(conn)
    return await service.get_all_program()


@router.delete("/{id}")
async def delete(id: int, conn: DbConnection):
    service = ProgramService(conn)
    return await service.delete(id)


@router.get("/{id}")
async def get_by_id(id: int, conn: DbConnection):
    service = ProgramService(conn)
    return await service.get_by_id_program(id)


@router.get("/{id}/cohorts")
async def get_program_cohort(id: int, conn: DbConnection):
    service = ProgramService(conn)
    return await service.get_program_cohort(id)
