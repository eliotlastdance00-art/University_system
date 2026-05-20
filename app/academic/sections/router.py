from fastapi import APIRouter, Depends
from aiomysql import Connection
from app.core.database import get_db
from .service import SectionService
from .schemas import (
    SectionCreate,
    UpdateSection
)



router = APIRouter()


@router.post("/", response_model=dict)
async def create_section(
    data: SectionCreate, conn: Connection = Depends(get_db)
):
    service = SectionService(conn)
    return await service.create_section(data)   


@router.get("/", response_model=list[dict])
async def get_all_sections(skip: int = 0, limit: int = 10, conn: Connection = Depends(get_db)):
    service = SectionService(conn)
    return await service.get_all_sections(skip, limit)  


@router.get("/{id}", response_model=dict)
async def get_section_by_id(id: int, conn: Connection = Depends(get_db)):
    service = SectionService(conn)
    return await service.get_section_by_id(id)  

@router.put("/", response_model=dict)
async def update_section(
    data: UpdateSection, conn: Connection = Depends(get_db)
):
    service = SectionService(conn)
    return await service.update_section(data)   

@router.delete("/{id}", response_model=dict)
async def delete_section(id: int, conn: Connection = Depends(get_db)):
    service = SectionService(conn)
    return await service.delete_section(id)