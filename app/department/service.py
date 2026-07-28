from app.academic.programs.repository import ProgramRepository

from .repository import DepartmentRepository
from .schemas import DepartmentCreate, DepartmentUpdate
from .exceptions import DepartmentAlreadyExistsError, DepartmentNotFoundError


class DepartmentService:
    def __init__(self, conn):
        self.repo = DepartmentRepository(conn)
        self.prog_repo = ProgramRepository(conn)

    async def _get_or_404(self, id: int) -> dict:
        department = await self.repo.get_department_by_id(id)
        if not department:
            raise DepartmentNotFoundError()
        return department

    async def deparment_create(self, data: DepartmentCreate):
        existing = await self.repo.get_department_by_name(data.name)
        if existing:
            raise DepartmentAlreadyExistsError()

        await self.repo.create_department(data.name, data.faculty_id)
        return {"message": "Succesfully created department"}

    async def department_update(self, id: int, data: DepartmentUpdate):
        department = await self._get_or_404(id)
        new_name = data.name or department["name"]
        new_faculty_id = data.faculty_id or department["faculty_id"]

        await self.repo.update_department(id, new_name, new_faculty_id)
        return {"message": "Succesfully updated this department"}

    async def department_delete(self, id: int):
        await self._get_or_404(id)
        await self.repo.delete_department(id)
        return {"message": "Succesfully deleted that department"}

    async def department_all_faculty(self, faculty_id: int):
        return await self.repo.get_all_department_faculty(faculty_id)

    async def department_incremental(self, last_id: int = 0, limit: int = 10):
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
        return await self._get_or_404(id)

    async def get_department_programs(self, department_id: int) -> list[dict]:
        await self._get_or_404(department_id)
        return await self.prog_repo.get_department_programs(department_id)

    async def get_department_teachers(self, department_id: int) -> list[dict]:
        await self._get_or_404(department_id)
        return await self.repo.get_department_teachers(department_id)

    async def get_department_students(self, department_id: int) -> list[dict]:
        await self._get_or_404(department_id)
        return await self.repo.get_department_students(department_id)
