from pydantic import BaseModel


class UpdateProfile(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    faculty_id: int | None = None
    department_id: int | None = None
    section_id: int | None = None



        