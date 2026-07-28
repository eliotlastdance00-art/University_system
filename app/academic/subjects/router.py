from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.core.database import get_db

from . import service
from .schemas import SubjectCreate, SubjectResponse, SubjectUpdate

router = APIRouter()

DbConnection = Annotated[Connection, Depends(get_db)]


@router.post("/", response_model=SubjectResponse)
async def post_subject(data: SubjectCreate, conn: DbConnection) -> SubjectResponse:
    return await service.create_subject(conn, data)


@router.get("/faculty/{faculty_id}", response_model=list[SubjectResponse])
async def get_faculty_subjects(faculty_id: int, conn: DbConnection):
    return await service.get_subject_faculty_all(conn, faculty_id)


# Department boýunça
@router.get("/department/{department_id}", response_model=list[SubjectResponse])
async def get_department_subjects(
    department_id: int, conn: DbConnection
):
    return await service.get_subject_department_all(conn, department_id)


# ID boýunça
@router.get("/{id}", response_model=dict)
async def get_subject(id: int, conn: DbConnection) -> dict:
    return await service.get_subject_id(conn, id)


# Üýtget
@router.put("/{id}", response_model=dict)
async def update_subject(
    id: int, data: SubjectUpdate, conn: DbConnection
):
    return await service.update_subject(conn, data, id)
