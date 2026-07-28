from fastapi import HTTPException

from app.academic.academic_years.repository import AcademicYearRepository
from app.academic.academic_years.schemas import (
    Academic_yearCreate,
    Academic_yearResponse,
    Academic_yearUpdate,
)


class AcademicYearService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = AcademicYearRepository(self.conn)

    async def create(self, data: Academic_yearCreate) -> Academic_yearResponse:
        if data.year_start >= data.year_end:
            raise HTTPException(
                status_code=400,
                detail="year_start must be less than year_end",
            )

        result = await self.repo.create(data)
        return Academic_yearResponse(**result)

    async def update(self, data: Academic_yearUpdate) -> Academic_yearResponse:
        if (
            data.year_start is not None
            and data.year_end is not None
            and data.year_start >= data.year_end
        ):
            raise HTTPException(
                status_code=400,
                detail="year_start must be less than year_end",
            )
        result = await self.repo.update(data)
        if not result:
            raise HTTPException(
                status_code=404,
                detail="Not found this academic year id",
            )
        return Academic_yearResponse(**result)

    async def get_all(self) -> list[Academic_yearResponse]:
        result = await self.repo.get_all()
        return [Academic_yearResponse(**item) for item in result]
