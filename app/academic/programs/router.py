from fastapi import APIRouter,Depends
from app.core.database import get_db
from .service import ProgramService
from aiomysql import Connection
from .schemas import ProgramCreate,ProgramUpdate



router=APIRouter



@router.post("/")
async def create(data:ProgramCreate,conn:Connection=Depends(get_db)):
    service=ProgramService(conn)
    await service.create(data)


@router.put("/")
async def update(data:ProgramUpdate,conn:Connection=Depends(get_db)):
    service=ProgramService(conn)
    await service.update(data)

@router.get("/")
async def get_all_program(conn:Connection=Depends(get_db)):
    service=ProgramService(conn)
    return await service.get_all_program()