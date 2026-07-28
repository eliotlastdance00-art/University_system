from app.academic.sections.repository import SectionRepository

from .exceptions import CohortAlreadyExistsError, CohortNotFoundError
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
            raise CohortAlreadyExistsError()
        return await self.repo.create(data)

    async def update(self, id: int, data: ChUpdate):
        cohort = await self.repo.get_by_id(id)
        if not cohort:
            raise CohortNotFoundError()
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
            raise CohortNotFoundError()
        return result

    async def delete(self, id: int):
        cohort = await self.repo.get_by_id(id)
        if not cohort:
            raise CohortNotFoundError()
        return await self.repo.delete(id)

    async def get_cohort_section(self, id: int) -> list[dict]:
        cohort = await self.repo.get_by_id(id)
        if not cohort:
            raise CohortNotFoundError()
        return await self.sec_repo.get_sections_by_cohort_id(id)
