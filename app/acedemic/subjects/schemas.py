from pydantic import BaseModel, Field

class SubjectCreate(BaseModel):
    name:          str = Field(min_length=3, max_length=100)
    credits:       int
    department_id: int

class SubjectUpdate(BaseModel):
    name:          str | None = None
    credits:       int | None = None
    department_id: int | None = None

class SubjectResponse(BaseModel):
    id:            int
    name:          str
    credits:       int
    department_id: int
    department_name: str