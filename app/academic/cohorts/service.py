from fastapi import HTTPException

from app.academic.sections.repository import SectionRepository

from .repository import CohortRepository
from .schemas import ChCreate, ChUpdate


class CohortService:
    def __init__(self, conn):
        self.repo = CohortRepository(conn)
        self.sec_repo = SectionRepository(conn)

    async def create(self, data: ChCreate):
        duplicate_cohort = await self.repo.get_by_program_id_and_academic_year_id(
            data.program_id, data.academic_year_id
        )
        if duplicate_cohort:
            raise HTTPException(
                status_code=409,
                detail="Cohort already created with that program id and academic year id",
            )
        return await self.repo.create(data)

    async def update(self, id: int, data: ChUpdate):
        cohort = await self.repo.get_by_id(id)
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
            program_id=new_program_id, academic_year_id=new_academic_year_id
        )
        return await self.repo.update(id, data)

    async def get_all(self) -> list[dict]:
        return await self.repo.get_all()

    async def get_by_id(self, id: int) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise HTTPException(status_code=404, detail="Not found cohort")
        return result

    async def delete(self, id: int):
        section = await self.repo.get_by_id(id)
        if not section:
            raise HTTPException(status_code=404, detail="Not found cohort")
        return await self.repo.delete(id)

    async def get_cohort_section(self, id: int) -> list[dict]:
        cohort = await self.repo.get_by_id(id)
        if not cohort:
            raise HTTPException(status_code=404, detail="Not found cohort")
        return await self.sec_repo.get_sections_by_cohort_id(id)
