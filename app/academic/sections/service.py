from fastapi import HTTPException

from .repository import SectionRepository
from .schemas import SectionCreate, UpdateSection


class SectionService:
    def __init__(self, conn):
        self.repo = SectionRepository(conn)

    async def create_section(self, data: SectionCreate):
        await self.repo.create_section(data)
        return {"message": "Successfully created section"}

    async def get_all_sections(self, skip: int = 0, limit: int = 10):
        return await self.repo.get_all_sections(skip, limit)

    async def get_section_by_id(self, id: int):
        section = await self.repo.get_section_by_id(id)
        if not section:
            raise HTTPException(
                status_code=404,
                detail="Not found this section id",
            )
        return section

    async def update_section(self, id: int, data: UpdateSection):
        existing = await self.repo.get_section_by_id(id)
        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Not found this section id",
            )
        new_cohort_id = data.cohort_id or existing["cohort_id"]
        new_number = data.number or existing["number"]
        new_capacity = data.capacity or existing["capacity"]
        data = UpdateSection(
            cohort_id=new_cohort_id,
            number=new_number,
            capacity=new_capacity,
        )
        return await self.repo.update_section(id, data)

    async def delete_section(self, id: int):
        existing = await self.repo.get_section_by_id(id)
        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Not found this section id",
            )
        await self.repo.delete_section(id)
        return {"message": "Successfully deleted that section"}

    async def get_section_student(self, id: int) -> list[dict]:
        section = await self.repo.get_section_by_id(id)
        if not section:
            raise HTTPException(status_code=404, detail="Not found section")
        return await self.repo.get_section_students(id)
