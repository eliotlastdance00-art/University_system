from pydantic import BaseModel


class SectionCreate(BaseModel):
    cohort_id: int
    number: int
    capasity: int


class UpdateSection(BaseModel):
    id: int
    cohort_id: int | None = None
    number: int | None = None
    capasity: int | None = None








