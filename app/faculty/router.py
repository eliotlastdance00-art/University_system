from fastapi import APIRouter,Depends
from aiomysql import Connection
from . import service
from .schemas import FacultyCreate,FacultyResponse,FacultyUpdate
from  app.core.database import get_db

router=APIRouter(
    prefix="/faculties",
    tags=["Faculty"]

)


@router.post("/",response_model=dict)
async def create_faculty(
    data:FacultyCreate,
    conn:Connection=Depends(get_db)
):
    return await service.create_faculty(conn,data)





@router.get("/",response_model=list[FacultyResponse])
async def get_all_faculties(
    conn:Connection=Depends(get_db)
):
    return await service.get_all_faculty(conn)





@router.get("/{faculty_id}",response_model=FacultyResponse)
async def get_faculty(
    faculty_id:int,
    conn:Connection=Depends(get_db)
    ):
    return await service.get_faculty_id(conn,faculty_id)





@router.put("/",response_model=dict)
async def update_faculty(
    faculty_id:int,
    data:FacultyUpdate,
    conn:Connection=Depends(get_db),
):
    return await service.update_faculty(conn,faculty_id,data)



@router.delete("/{faculty_id}",response_model=dict)
async def delete_faculty(faculty_id:int,conn:Connection=Depends(get_db)):
    return await service.delete_faculty(conn,faculty_id)