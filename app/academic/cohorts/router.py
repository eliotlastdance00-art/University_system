from .service import SectionService
from fastapi import APIRouter,Depends
from app.core.database import get_db
from aiomysql import Connection
from .schemas import  ChCreate, ChUpdate

router = APIRouter()



@router.post("/"
             )
async def create(data: ChCreate, conn: Connection = Depends(get_db)):
    service = SectionService(conn)
    return await service.create(data)
