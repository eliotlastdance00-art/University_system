from fastapi import APIRouter,Depends
from aiomysql import Connection
from app.faculty.service import FacultyService
from .schemas import FacultyCreate,FacultyResponse,FacultyUpdate
from  app.core.database import get_db
from app.core.dependencies import (
    admin_required,
    admin_or_dean
)

router=APIRouter()


@router.post( "/",
    response_model = list[FacultyResponse],
    summary = "Faculty create",
    description = "Admin or dean required")
async def create_faculty(
    data:FacultyCreate,
    current_user: dict = Depends(admin_or_dean),
    conn:Connection=Depends(get_db)
)-> list[dict]:
    service = FacultyService(conn)
    return await service.create_faculty(data)





@router.get(
        "/",
        response_model=list[FacultyResponse],
        summary="Call all faculties",
        description="Admin required just"
        )
async def get_all_faculties(
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
   
)-> list[dict]:
    service = FacultyService(conn)
    return await service.get_all_faculty()





@router.get(
        "/{faculty_id}",
        response_model=FacultyResponse,
        summary="Call all faculties",
        description="Admin required just"
        )
async def get_faculty(
    faculty_id:int,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db)
    )-> list[dict]:
    service = FacultyService(conn)
    return await service.get_faculty_id(faculty_id)





@router.put(
        "/",
        response_model=dict,
        summary="Update faculties id",
        description="Admin required just"
        )
async def update_faculty(
    faculty_id:int,
    data:FacultyUpdate,
    current_user: dict = Depends(admin_required),
    conn:Connection=Depends(get_db),
)-> list[dict]:
    service = FacultyService(conn)
    return await service.update_faculty(faculty_id,data)



@router.delete(
        "/{faculty_id}",
        response_model=dict,
        summary="Delete faculties",
        description="Admin required just"

        )
async def delete_faculty(
    faculty_id:int,
    conn:Connection=Depends(get_db),
    current_user: dict = Depends(admin_required),
    )->list[dict]:
    service = FacultyService(conn)
    return await service.delete_faculty(faculty_id)