from . import repository
from  .schemas import DepartmentCreate,DepartmentUpdate
from fastapi import HTTPException


#CREATE DEPARTMENT
async def deparment_create(conn,data:DepartmentCreate):
    existing=await repository.get_department_by_name(conn,data.name)
    print(existing)
    if  existing:
        raise HTTPException(
            status_code=400,
            detail="That department already created"
        )
    await repository.create_department(conn,data.name,data.faculty_id)
    return {"message":"Succesfully created department"}





#UPDATE DEPARTMENT
async def department_update(conn,department_id:int,data:DepartmentUpdate):
    department=await repository.get_department_by_id(conn,department_id)
    if not department:
        raise HTTPException(
            status_code=404,
            detail="Not found this department name"
        )
    new_name=data.name if  data.name else  department["name"]
    new_faculty_id=data.faculty_id if  data.faculty_id else  department["faculty_id"]
    await repository.update_department(conn,department_id,new_name,new_faculty_id)
    return {"message":"Succesfully updated this department"}



#DELETE DEPARTMENT

async def department_delete(conn,department_id:int):
    existing=await repository.get_department_by_id(conn,department_id)
    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Not found this department id"
        )
    await repository.delete_department(conn,department_id)
    return {"Succesfully deleted that department"}





#GET ALL DEPARTMENTS Faculty
async def department_all_faculty(conn,faculty_id:int):
    existing=await repository.get_all_department_faculty(conn,faculty_id)
    if not existing:
        return []
    return existing



#GET ALL reel
async def department_incremental(conn, last_id: int = 0, limit: int = 10):
    existing = await repository.get_departments_incrementally(conn, last_id, limit)
    
    if not existing:
        return {"items": [], "next_id": None, "has_more": False}

    # Listenin en sonundaki elemanın ID'sini alıyoruz
    last_fetched_id = existing[-1]["id"]
    
    return {
        "items": existing,
        "next_id": last_fetched_id,
        "has_more": len(existing) == limit # Eğer gelen veri limitteyse devamı olabilir
    }



#GET ID DEPARTMENTS

async def department_id_get(conn,department_id:int):
    existing= await repository.get_department_by_id(conn,department_id)
    if not existing:
        raise HTTPException(
            status_code=404,
            detail="IT NOT FOUND DEPARTMENT"
        )
    return existing




    