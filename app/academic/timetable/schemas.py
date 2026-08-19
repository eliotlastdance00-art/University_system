from datetime import time
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

# ─── ENUM ───────────────────────────────────────


class TimetableEnum(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"


class SemesterEnum(str, Enum):
    AUTUMN = "1"
    SPRING = "2"


# ─── BASE ───────────────────────────────────────


class TimetableBase(BaseModel):
    assignment_id: int = Field(..., gt=0, description="Assignment id")
    day: TimetableEnum = Field(..., description="Week days")
    start_time: time = Field(
        ..., description="Lesson start time", json_schema_extra={"example": "09:00:00"}
    )
    end_time: time = Field(
        ..., description="Lesson end time", json_schema_extra={"example": "10:30:00"}
    )

    room: str = Field(..., min_length=1, description="Room number or name")
    model_config = ConfigDict(from_attributes=True)


# ─── CREATE ─────────────────────────────────────


class TimetableCreate(TimetableBase):
    pass


# ─── UPDATE ─────────────────────────────────────


class TimetableUpdate(BaseModel):
    assignment_id: int | None = Field(None, gt=0)
    day: TimetableEnum | None = None
    start_time: time | None = None
    end_time: time | None = None
    room: str | None = Field(None, min_length=1)


# ─── RESPONSE ───────────────────────────────────


class TimetableResponse(TimetableBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ─── DETAIL RESPONSE (JOIN) ─────────────────────


class TimetableDetailResponse(BaseModel):
    id: int
    # Assignment
    assignment_id: int
    semester: SemesterEnum

    # Teacher
    teacher_id: int
    teacher_name: str

    # Subject
    subject_id: int
    subject_name: str

    # Group
    section_id: int
    group_name: str

    model_config = ConfigDict(from_attributes=True)


class GroupResponse(BaseModel):
    assignment_id: int = Field(..., gt=0, description="Assignment id")
    day: TimetableEnum = Field(..., description="Week days")
    start_time: time = Field(
        ..., description="Lesson start time", json_schema_extra={"example": "09:00:00"}
    )
    end_time: time = Field(
        ..., description="Lesson end time", json_schema_extra={"example": "10:30:00"}
    )

    room: str = Field(..., min_length=1, description="Room number or name")
    model_config = ConfigDict(from_attributes=True)
    teacher_name: str
    group_name: str


# ─── TASKS & DRAFTS ─────────────────────────────


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class TimetableTaskCreate(BaseModel):
    parameters: dict | None = Field(
        default_factory=dict,
        description="Generation parameters like department_id, academic_year_id",
    )


class TimetableTaskResponse(BaseModel):
    id: int
    status: TaskStatus
    parameters: dict | None = None
    error_message: str | None = None
    created_by: int | None = None

    model_config = ConfigDict(from_attributes=True)


class TimetableDraftResponse(TimetableBase):
    id: int
    task_id: int

    model_config = ConfigDict(from_attributes=True)
