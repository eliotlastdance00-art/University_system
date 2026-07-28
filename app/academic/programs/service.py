from app.academic.programs.repository import ProgramRepository

from .repository import ProgramRepository
from app.academic.cohorts.repository import CohortRepository
from .schemas import ProgramCreate, ProgramUpdate
from .exceptions import ProgramAlreadyExistsError, ProgramNotFoundError
from app.department.exceptions import DepartmentNotFoundError
from app.department.repository import DepartmentRepository


class ProgramService:
    def __init__(self, conn):
        self.repo = ProgramRepository(conn)
        self.drepo = DepartmentRepository(conn)
        self.ch_repo = CohortRepository(conn)

    async def _get_or_404(self, id: int) -> dict:
        result = await self.repo.get_by_id_programm(id)
        if not result:
            raise ProgramNotFoundError()
        return result

    async def create(self, data: ProgramCreate):
        department = await self.drepo.get_department_by_id(data.department_id)
        if not department:
            raise DepartmentNotFoundError()
        duplicate_program = await self.repo.get_by_name_programm(data.name)
        if duplicate_program:
            raise ProgramAlreadyExistsError()
        await self.repo.create(data)

    async def update(self, id: int, data: ProgramUpdate):
        program = await self._get_or_404(id)
        new_name = data.name or program["name"]
        neew_code = data.code or program["code"]
        new_department_id = data.department_id or program["department_id"]
        data = ProgramUpdate(
            id=id, name=new_name, code=neew_code, department_id=new_department_id
        )
        await self.repo.update(id, data)

    async def get_all_program(self) -> list[dict]:
        return await self.repo.get_all_programm()

    async def get_by_id_program(self, id: int) -> dict:
        return await self._get_or_404(id)

    async def delete(self, id: int) -> dict:
        await self._get_or_404(id)
        await self.repo.delete(id)

    async def get_program_cohort(self, id: int) -> list[dict]:
        await self._get_or_404(id)
        return await self.ch_repo.get_by_program_id(id)
