from enum import Enum

from pydantic import BaseModel, Field

# ─── ENUM ───────────────────────────────────────


class SemesterEnum(str, Enum):
    first = "1"
    second = "2"


# ─── BASE ───────────────────────────────────────


class AssignmentBase(BaseModel):
    user_id: int = Field(..., gt=0, description="Mugallymyň ID-si")
    subject_id: int = Field(..., gt=0, description="Dersiň ID-si")
    section_id: int = Field(..., gt=0, description="Toparyň ID-si")
    semester: SemesterEnum = Field(..., description="Semester 1 ýa 2")


# ─── CREATE ─────────────────────────────────────


class AssignmentCreate(AssignmentBase):
    pass


# ─── UPDATE ─────────────────────────────────────


class AssignmentUpdate(BaseModel):
    user_id: int | None = Field(None, gt=0)
    subject_id: int | None = Field(None, gt=0)
    section_id: int | None = Field(None, gt=0)
    semester: SemesterEnum | None = None


# ─── RESPONSE ───────────────────────────────────


class AssignmentResponse(AssignmentBase):
    id: int

    class Config:
        from_attributes = True


# ─── DETAIL RESPONSE (JOIN bilen) ───────────────


class AssignmentDetailResponse(BaseModel):
    id: int
    semester: SemesterEnum

    # Mugallym
    teacher_id: int
    teacher_name: str

    # Ders
    subject_id: int
    subject_name: str

    # Topar
    section_id: int
    group_name: str

    class Config:
        from_attributes = True


# ─── MUGALLYMYŇ TERTIBI ──────────────────────────


class TeacherScheduleResponse(BaseModel):
    assignment_id: int
    subject_name: str
    group_name: str
    semester: SemesterEnum
    timetable: list[dict] = []
    # [{"day": "monday", "start_time": "09:00", "room": "301"}]

    class Config:
        from_attributes = True
