from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.core.database import get_db

from .schemas import Academic_yearCreate, Academic_yearResponse, Academic_yearUpdate
from .service import AcademicYearService

router = APIRouter()


@router.post("/", response_model=Academic_yearResponse)
async def create_academic_year(
    data: Academic_yearCreate, conn: Annotated[Connection, Depends(get_db)]
):
    service = AcademicYearService(conn)
    return await service.create(data)


@router.put("/{id}", response_model=Academic_yearResponse)
async def update_academic_year(
    id: int, data: Academic_yearUpdate, conn: Annotated[Connection, Depends(get_db)]
):
    service = AcademicYearService(conn)
    data.id = id
    return await service.update(data)


@router.get("/", response_model=list[Academic_yearResponse])
async def get_all_academic_years(conn: Annotated[Connection, Depends(get_db)]):
    service = AcademicYearService(conn)
    return await service.get_all()
