from .service import SectionService
from fastapi import APIRouter,Depends
from app.core.database import get_db
from aiomysql import Connection
from .schemas import  ChCreate, ChUpdate

router = APIRouter()



@router.post("")
async def create(data: ChCreate, conn: Connection = Depends(get_db)):
    service = SectionService(conn)
    return await service.create(data)

@router.get("")
async  def get_all(conn: Connection = Depends(get_db)):
    service = SectionService(conn)
    return await service.get_all()

@router.get("/{id}")
async def get_by_id(id: int, conn: Connection = Depends(get_db)):
    service = SectionService(conn)
    return await service.get_by_id(id)

@router.put("/{id}")
async def update(id: int, data: ChUpdate, conn: Connection = Depends(get_db)):
    service = SectionService(conn)
    return await service.update(id, data)

@router.delete("/{id}")
async def delete(id: int, conn: Connection = Depends(get_db)):
    service = SectionService(conn)
    return await service.delete(id)