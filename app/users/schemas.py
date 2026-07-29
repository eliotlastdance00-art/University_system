from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(min_length=3, max_length=72)
    email: EmailStr
    password: str = Field(min_length=6)


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_active: bool


class UserRoleCreate(BaseModel):
    user_id: int
    role_id: int
    faculty_id: int | None = None
    department_id: int | None = None
    section_id: int | None = None



class UserSearchFilters(BaseModel):
    name: str | None = None
    role: str | None = None
    faculty_id: int | None = None
    department_id: int | None = None
    section_id: int | None = None

class SectionAssign(BaseModel):
    section_id: int

