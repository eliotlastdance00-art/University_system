from  . import repository
from  .schemas import FacultyCreate,FacultyUpdate
from fastapi import HTTPException


#     Created faculty
async def create_faculty(conn,data:FacultyCreate):
    existing=await repository.get_faculty_by_code(conn,data.code)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Faculty is already existing!"
        )
    await repository.create_faculty(conn,data.name,data.code)
    return {"message":"Created that faculty!"}






#    Get all faculty
async def get_all_faculty(conn):
    faculties=await repository.get_all_faculty(conn)
    if not faculties:
        return []
    return faculties





#Get {id} faculty
async def get_faculty_id(conn,faculty_id):
    faculty=await repository.get_faculty_by_id(conn,faculty_id)
    if not faculty:
        raise HTTPException(
            status_code=404,
            detail="Not found this faculty!"
        )
    return faculty





#    Update faculty        
async def update_faculty(conn,faculty_id:int,data:FacultyUpdate):
    faculty=await repository.get_faculty_by_id(conn,faculty_id)
    if not faculty:
        raise HTTPException(
            status_code=404,
            detail="Not found this faculty!"
        )
    new_name=data.name if  data.name else  faculty["name"]
    new_code=data.code if  data.code else  faculty["code"]
    await repository.update_faculty(conn,faculty_id,new_name,new_code)
    return {"message":"Changed Faculty"}






#.     Delete faculty
async def delete_faculty(conn,faculty_id):
    faculty= await repository.get_faculty_by_id(conn,faculty_id)
    if not faculty:
        raise HTTPException(
            status_code=404,
            detail="Not found that faculty!!!"
        )
    await repository.delete_faculty(conn,faculty_id)
    return {"message":"Succesfull delleted this faculty."}



