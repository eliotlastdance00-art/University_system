from . import service
from .schemas import SubjectCreate,SubjectResponse,SubjectUpdate
from fastapi import APIRouter,Depends
from aiomysql import Connection
from  app.core.database import get_db



router=APIRouter()



@router.post("/",response_model=dict)
async def post_subject(
    data:SubjectCreate,
    conn:Connection=Depends(get_db)
)-> dict:
    return await service.create_subject(conn,data)


@router.get("/faculty/{faculty_id}",response_model=list[SubjectResponse])
async def get_faculty_subjects(faculty_id:int,conn:Connection=Depends(get_db)):
    return await service.get_subject_faculty_all(conn,faculty_id)



# Department boýunça
@router.get("/department/{department_id}", response_model=list[SubjectResponse])
async def get_department_subjects(
    department_id: int,
    conn: Connection = Depends(get_db)
):
    return await service.get_subject_department_all(conn, department_id)

# ID boýunça
@router.get("/{subject_id}", response_model=dict)
async def get_subject(
    subject_id: int,
    conn: Connection = Depends(get_db)
)-> dict:
    return await service.get_subject_id(conn, subject_id)

# Üýtget
@router.put("/{subject_id}", response_model=dict)
async def update_subject(
    subject_id: int,
    data: SubjectUpdate,
    conn: Connection = Depends(get_db)
):
    return await service.update_subject(conn, data, subject_id)



