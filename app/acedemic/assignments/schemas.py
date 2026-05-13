from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


# ─── ENUM ───────────────────────────────────────

class SemesterEnum(str, Enum):
    first  = "1"
    second = "2"


# ─── BASE ───────────────────────────────────────

class AssignmentBase(BaseModel):
    user_id:    int = Field(..., gt=0, description="Mugallymyň ID-si")
    subject_id: int = Field(..., gt=0, description="Dersiň ID-si")
    group_id:   int = Field(..., gt=0, description="Toparyň ID-si")
    semester:   SemesterEnum         = Field(..., description="Semester 1 ýa 2")


# ─── CREATE ─────────────────────────────────────

class AssignmentCreate(AssignmentBase):
    pass


# ─── UPDATE ─────────────────────────────────────

class AssignmentUpdate(BaseModel):
    user_id:    Optional[int]          = Field(None, gt=0)
    subject_id: Optional[int]          = Field(None, gt=0)
    group_id:   Optional[int]          = Field(None, gt=0)
    semester:   Optional[SemesterEnum] = None


# ─── RESPONSE ───────────────────────────────────

class AssignmentResponse(AssignmentBase):
    id: int

    class Config:
        from_attributes = True


# ─── DETAIL RESPONSE (JOIN bilen) ───────────────

class AssignmentDetailResponse(BaseModel):
    id:           int
    semester:     SemesterEnum

    # Mugallym
    teacher_id:   int
    teacher_name: str

    # Ders
    subject_id:   int
    subject_name: str

    # Topar
    group_id:     int
    group_name:   str

    class Config:
        from_attributes = True


# ─── MUGALLYMYŇ TERTIBI ──────────────────────────

class TeacherScheduleResponse(BaseModel):
    assignment_id: int
    subject_name:  str
    group_name:    str
    semester:      SemesterEnum
    timetable: list[dict] = []
    # [{"day": "monday", "start_time": "09:00", "room": "301"}]

    class Config:
        from_attributes = True