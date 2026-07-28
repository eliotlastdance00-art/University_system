from fastapi import HTTPException

from app.academic.programs.repository import ProgramRepository

from .repository import DepartmentRepository
from .schemas import DepartmentCreate, DepartmentUpdate


class DepartmentService:
    def __init__(self, conn):
        self.repo = DepartmentRepository(conn)
        self.prog_repo = ProgramRepository(conn)

    async def deparment_create(self, data: DepartmentCreate):
        existing = await self.repo.get_department_by_name(data.name)

        if existing:
            raise HTTPException(
                status_code=400,
                detail="That department already created",
            )

        await self.repo.create_department(data.name, data.faculty_id)
        return {"message": "Succesfully created department"}

    async def department_update(
        self,
        id: int,
        data: DepartmentUpdate,
    ):
        department = await self.repo.get_department_by_id(id)
        if not department:
            raise HTTPException(
                status_code=404,
                detail="Not found this department name",
            )

        new_name = data.name or department["name"]
        new_faculty_id = data.faculty_id or department["faculty_id"]

        await self.repo.update_department(id, new_name, new_faculty_id)
        return {"message": "Succesfully updated this department"}

    async def department_delete(self, id: int):
        existing = await self.repo.get_department_by_id(id)
        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Not found this department id",
            )

        await self.repo.delete_department(id)
        return {"message": "Succesfully deleted that department"}

    async def department_all_faculty(self, faculty_id: int):
        return await self.repo.get_all_department_faculty(faculty_id)

    async def department_incremental(
        self,
        last_id: int = 0,
        limit: int = 10,
    ):
        existing = await self.repo.get_departments_incrementally(last_id, limit)

        if not existing:
            return {"items": [], "next_id": None, "has_more": False}

        last_fetched_id = existing[-1]["id"]

        return {
            "items": existing,
            "next_id": last_fetched_id,
            "has_more": len(existing) == limit,
        }

    async def department_id_get(self, id: int):
        existing = await self.repo.get_department_by_id(id)
        if not existing:
            raise HTTPException(
                status_code=404,
                detail="IT NOT FOUND DEPARTMENT",
            )
        return existing

    async def get_department_programs(self, department_id: int) -> list[dict]:
        existing = await self.repo.get_department_by_id(department_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Not found department")
        return await self.prog_repo.get_department_programs(department_id)

    async def get_department_teachers(self, department_id: int) -> list[dict]:
        existing = await self.repo.get_department_by_id(department_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Not found department")
        return await self.repo.get_department_teachers(department_id)

    async def get_department_students(self, department_id: int) -> list[dict]:
        existing = await self.repo.get_department_by_id(department_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Not found department")
        return await self.repo.get_department_students(department_id)
