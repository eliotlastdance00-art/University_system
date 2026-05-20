from fastapi import HTTPException

from .repository import CohortRepository
from .schemas import ChCreate, ChUpdate


class SectionService:
    def __init__(self, conn):
        self.repo = CohortRepository(conn)

    async def create(self, data: ChCreate):
        duplicate_cohort = await self.repo.get_by_name(data.name)
        if duplicate_cohort:
            raise HTTPException(status_code=409, detail="Cohort already created")
        duplicate_cohort = await self.repo.get_by_program_id_and_academic_year_id(
            data.program_id, data.academic_year_id
        )
        if duplicate_cohort:
            raise HTTPException(
                status_code=409,
                detail="Cohort already created with that program id and academic year id",
            )
        return await self.repo.create(data)

    async def update(self, data: ChUpdate):
        cohort = await self.repo.get_by_id(data.id)
        if not cohort:
            raise HTTPException(status_code=404, detail="Not found cohort")
        new_program_id = (
            data.program_id if data.program_id is not None else cohort["program_id"]
        )
        new_academic_year_id = (
            data.academic_year_id
            if data.academic_year_id is not None
            else cohort["academic_year_id"]
        )
        data = ChUpdate(
            id=data.id, program_id=new_program_id, academic_year_id=new_academic_year_id
        )
        return await self.repo.update(data)

    async def get_all(self) -> list[dict]:
        return await self.repo.get_all()

    async def get_by_id(self, id: int) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise HTTPException(status_code=404, detail="Not found section")
        return result
