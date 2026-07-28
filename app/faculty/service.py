from fastapi import HTTPException

from app.department.repository import DepartmentRepository
from app.faculty.repository import FacultyRepository

from .schemas import FacultyCreate, FacultyResponse, FacultyUpdate


class FacultyService:
    def __init__(self, conn):
        self.repo = FacultyRepository(conn)
        self.dp_repo = DepartmentRepository(conn)

    #     Created faculty
    async def create_faculty(self, data: FacultyCreate) -> list[dict]:
        existing = await self.repo.get_faculty_by_code(data.code)
        if existing:
            raise HTTPException(status_code=400, detail="Faculty is already existing!")
        await self.repo.create_faculty(data.name, data.code)
        faculty = await self.repo.get_faculty_by_code(data.code)
        return FacultyResponse(**faculty)

    #    Get all faculty
    async def get_all_faculty(self) -> list[dict]:
        faculties = await self.repo.get_all_faculty()
        return faculties or []

    # Get {id} faculty
    async def get_faculty_id(self, id: int) -> dict:
        faculty = await self.repo.get_faculty_by_id(id)
        if not faculty:
            raise HTTPException(status_code=404, detail="Not found this faculty!")
        return faculty

    #    Update faculty
    async def update_faculty(self, id: int, data: FacultyUpdate) -> dict:
        faculty = await self.repo.get_faculty_by_id(id)
        if not faculty:
            raise HTTPException(status_code=404, detail="Not found this faculty!")
        new_name = data.name
        new_code = data.code 
        await self.repo.update_faculty(id, new_name, new_code)
        return {"message": "Changed Faculty"}

    # .     Delete faculty
    async def delete_faculty(self, id):
        faculty = await self.repo.get_faculty_by_id(id)
        if faculty:
            raise HTTPException(status_code=404, detail="Not found that faculty!!!")
        await self.repo.delete_faculty(id)
        return {"message": "Succesfull delleted this faculty."}

    async def get_faculty_department(self, id: int) -> list[dict]:
        faculty = await self.repo.get_faculty_by_id(id)
        print(faculty)
        if not faculty:
            raise HTTPException(status_code=404, detail="Not found that faculty!!!")
        return await self.dp_repo.get_all_department_faculty(id)
