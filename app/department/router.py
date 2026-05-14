from fastapi import APIRouter,Depends
from aiomysql import Connection
from . import service
from .schemas import DepartmentCreate,DepartmentResponse,DepartmentUpdate
from  app.core.database import get_db

router=APIRouter()


@router.get("/{faculty_id}",response_model=list[DepartmentResponse])
async def get_all_departments(faculty_id:int,conn:Connection=Depends(get_db)):
    return await service.department_all(conn,faculty_id)


@router.get("/{department_id}",response_model=DepartmentResponse)
async def get_id_department(department_id:int,conn:Connection=Depends(get_db)):
    return await service.department_id_get(conn,department_id)


@router.post("/",response_model=dict)
async def create_new_department(data:DepartmentCreate,conn:Connection=Depends(get_db)):
    return await service.deparment_create(conn,data)



@router.delete("/",response_model=dict)
async def delete_id_department(department_id:int,conn:Connection=Depends(get_db)):
    return await service.department_delete(conn,department_id)


@router.put("/",response_model=dict)
async def put_department(department_id:int,data:DepartmentUpdate,conn:Connection=Depends(get_db)):
    return await service.department_update(conn,department_id,data)


