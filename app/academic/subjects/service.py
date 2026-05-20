from . import repository
from fastapi import HTTPException
from .schemas import SubjectResponse,SubjectUpdate,SubjectCreate
from app.faculty import repository as faculty_repository
from app.department import repository as department_repository





#         CREATE_SUBJECT
async def create_subject(conn,data:SubjectCreate) -> dict:
    department= await department_repository.get_department_by_id(conn,data.department_id)
    if not department:
        raise HTTPException(
            status_code=404,
            detail="Not found department"
        )
    name=await repository.get_name_subjects(conn,data.name,data.department_id)
    if name:
        raise HTTPException(
            status_code=400,
            detail="This subject name has already"
        )
    await repository.create_subject(conn,data.name, data.credits, data.department_id)
    subject=await repository.get_name_subjects(conn,data.name,data.department_id)
    return SubjectResponse(**subject)



#         UPDATE SUBJECT
async def update_subject(conn,data:SubjectUpdate,subject_id:int):
    subject= await repository.get_id_subjects(conn,subject_id)
    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Not found subject"
        )
    new_name      = data.name or subject["name"]
    new_creadits  = data.credits or subject["credits"]
    new_department= data.department_id or subject["department_id"]
    await repository.update_subject(conn,subject_id,new_name,new_creadits,new_department)
    return {"message": "Changed Subject ✅"}




#         GET ALL SUBJECT
async def get_all_subject(conn):
    subject=await repository.get_all_subjects(conn)
    return [SubjectResponse(**s) for s in subject]



#       GET ALL SUBJECT FACULTY
async def get_subject_faculty_all(conn,faculty_id:int)-> list[SubjectResponse]:
    faculty= await faculty_repository.get_faculty_by_id(conn,faculty_id)
    if not faculty:
        raise HTTPException(
            status_code=404,
            detail="Not found faculty"
        )
    subject=await repository.get_all_subjects_FACULTY(conn,faculty_id)
    return [SubjectResponse(**s) for s in subject]



#       GET ALL SUBJECT DEPARTMENT
async def get_subject_department_all(conn,department_id:int):
    department= await department_repository.get_department_by_id(conn,department_id)
    if not department:
        raise HTTPException(
            status_code=404,
            detail="Not found department"
        )
    subject=await repository.get_all_subjects_department(conn,department_id)
    return [SubjectResponse(**s) for s in subject]


#     GET SUBJECT ID
async def get_subject_id(conn,subject_id:int):
    subject=await repository.get_id_subjects(conn,subject_id)
    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Not found subject"
        )
    return subject



