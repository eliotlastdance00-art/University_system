from fastapi import APIRouter,Depends
from app.core.database import get_db
from .service import ProgramService
from aiomysql import Connection
from .schemas import ProgramCreate,ProgramUpdate



router=APIRouter()



@router.post("/")
async def create(data:ProgramCreate,conn:Connection=Depends(get_db)):
    service=ProgramService(conn)
    await service.create(data)


@router.put("/{id}")
async def update(id:int,data:ProgramUpdate,conn:Connection=Depends(get_db)):
    service=ProgramService(conn)
    await service.update(id,data)

@router.get("/")
async def get_all_program(conn:Connection=Depends(get_db)):
    service=ProgramService(conn)
    return await service.get_all_program()



@router.delete("/{id}")
async def delete(id:int,conn:Connection=Depends(get_db)):
    service=ProgramService(conn)
    await service.delete(id)

@router.get("/{id}")
async def get_by_id(id:int,conn:Connection=Depends(get_db)):
    service=ProgramService(conn)
    await service.get_by_id_program(id)


@router.get("/{id}/cohorts")    
async def get_program_cohort(id:int,conn:Connection=Depends(get_db)):
    service=ProgramService(conn)
    await service.get_program_cohort(id)