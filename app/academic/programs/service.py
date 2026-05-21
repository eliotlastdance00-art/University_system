from fastapi import HTTPException

from app.department.repository import DepartmentRepository

from .repository import ProgramRepository
from app.academic.cohorts.repository import CohortRepository
from .schemas import ProgramCreate, ProgramUpdate


class ProgramService:
    def __init__(self, conn):
        self.repo = ProgramRepository(conn)
        self.drepo = DepartmentRepository(conn)
        self.ch_repo=CohortRepository(conn)

    async def create(self, data: ProgramCreate):
        department = await self.drepo.get_department_by_id(data.department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Not found department")
        duplicate_program = await self.repo.get_by_name_programm(data.name)
        if duplicate_program:
            raise HTTPException(status_code=409, detail="Program already created")
        await self.repo.create(data)

    async def update(self, id:int,data: ProgramUpdate):
        program = await self.repo.get_by_id_programm(id)
        if not program:
            raise HTTPException(status_code=404, detail="Not found program")
        new_name = data.name or program["name"]
        neew_code = data.code or program["code"]
        new_department_id = data.department_id or program["department_id"]
        data = ProgramUpdate(
            id=id, name=new_name, code=neew_code, department_id=new_department_id
        )
        await self.repo.update(data)

    async def get_all_program(self) -> list[dict]:
        return await self.repo.get_all_programm()

    async def get_by_id_program(self, id: int) -> list[dict]:
        result = await self.repo.get_by_id_programm(id)
        if not result:
            raise HTTPException(status_code=404, detail="Not found program")
        return await result
    


    async def delete(self,id:int)->dict:
        await self.get_by_id_program(id)
        await self.repo.delete(id) 

    async def get_program_cohort(self,id:int)->list[dict]:
        exist=await self.get_by_id_program(id) 
        if not exist:
            raise HTTPException(
                status_code=404,
                detail="Not found program"
            )
        await self.ch_repo.get_by_program_id(id)   

