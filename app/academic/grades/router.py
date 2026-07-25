from fastapi import APIRouter, Depends, status
from app.core.database import get_db
from app.core.dependencies import admin_or_teacher, get_current_user
from app.academic.grades.schemas import GradeCreate, GradeUpdate, GradeResponse
from app.academic.grades.service import GradeService

router = APIRouter()

@router.post("/", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
async def create_grade(
    data: GradeCreate,
    current_user: dict = Depends(admin_or_teacher),
    db=Depends(get_db)
):
    service = GradeService(db)
    return await service.create_grade(data, current_user)

@router.get("/{grade_id}", response_model=GradeResponse)
async def get_grade(
    grade_id: int,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    service = GradeService(db)
    return await service.get_grade(grade_id)

@router.put("/{grade_id}", response_model=GradeResponse)
async def update_grade(
    grade_id: int,
    data: GradeUpdate,
    current_user: dict = Depends(admin_or_teacher),
    db=Depends(get_db)
):
    service = GradeService(db)
    return await service.update_grade(grade_id, data, current_user)

@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grade(
    grade_id: int,
    current_user: dict = Depends(admin_or_teacher),
    db=Depends(get_db)
):
    service = GradeService(db)
    await service.delete_grade(grade_id, current_user)

@router.get("/student/{student_id}", response_model=list[GradeResponse])
async def get_grades_for_student(
    student_id: int,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    service = GradeService(db)
    return await service.get_grades_for_student(student_id)
