from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str
    faculty_id: int


class DepartmentUpdate(BaseModel):
    name: str | None = None
    faculty_id: int | None = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    faculty_id: int
    faculty_name: str


class DepartmentSchema(BaseModel):
    last_id: int = 0
    limit: int = 10


# schemas.py
class DepartmentPaginationResponse(BaseModel):
    items: list[DepartmentResponse]
    next_id: int | None  # Bir sonraki istekte kullanılacak last_id
    has_more: bool  # Daha fazla veri var mı?
