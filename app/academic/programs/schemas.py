from pydantic import BaseModel


class ProgramCreate(BaseModel):
    name: str
    code: str
    department_id: int


class ProgramUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    department_id: int | None = None
