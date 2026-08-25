from datetime import time
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

# ─── ENUMS ──────────────────────────────────────


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


class RoomTypeEnum(str, Enum):
    NORMAL = "NORMAL"
    PC_LAB = "PC_LAB"
    SCIENCE_LAB = "SCIENCE_LAB"
    DRAWING_STUDIO = "DRAWING_STUDIO"
    AMPHITHEATER = "AMPHITHEATER"


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ─── TIMETABLE BASE ────────────────────────────


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


# ─── TIMETABLE CREATE ──────────────────────────


class TimetableCreate(TimetableBase):
    room_id: int | None = Field(None, gt=0, description="Room FK (optional)")


# ─── TIMETABLE UPDATE ──────────────────────────


class TimetableUpdate(BaseModel):
    assignment_id: int | None = Field(None, gt=0)
    day: TimetableEnum | None = None
    start_time: time | None = None
    end_time: time | None = None
    room: str | None = Field(None, min_length=1)
    room_id: int | None = Field(None, gt=0)


# ─── TIMETABLE RESPONSES ───────────────────────


class TimetableResponse(TimetableBase):
    id: int
    room_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class TimetableDetailResponse(BaseModel):
    id: int
    # Assignment
    assignment_id: int
    semester: SemesterEnum | None = None

    # Teacher
    teacher_id: int
    teacher_name: str

    # Subject
    subject_id: int
    subject_name: str

    # Group
    section_id: int
    section_number: int

    # Schedule
    day: TimetableEnum
    start_time: time
    end_time: time
    room: str
    room_id: int | None = None

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
    section_number: str


# ─── ROOMS ──────────────────────────────────────


class RoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Room name, e.g. A-101")
    capacity: int = Field(30, gt=0, description="Max student capacity")
    room_type: RoomTypeEnum = Field(RoomTypeEnum.NORMAL, description="Room type")
    building: str | None = Field(None, max_length=50, description="Building name")
    floor: int | None = Field(None, description="Floor number")
    is_active: bool = Field(True, description="Is room available for scheduling")


class RoomUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    capacity: int | None = Field(None, gt=0)
    room_type: RoomTypeEnum | None = None
    building: str | None = Field(None, max_length=50)
    floor: int | None = None
    is_active: bool | None = None


class RoomResponse(BaseModel):
    id: int
    name: str
    capacity: int
    room_type: RoomTypeEnum
    building: str | None = None
    floor: int | None = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# ─── TIME SLOTS ─────────────────────────────────


class TimeSlotResponse(BaseModel):
    id: int
    slot_number: int
    label: str
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)


# ─── TEACHER AVAILABILITY ──────────────────────


class TeacherAvailabilityCreate(BaseModel):
    user_id: int = Field(..., gt=0, description="Teacher user ID")
    day: TimetableEnum = Field(..., description="Day of the week")
    slot_number: int = Field(..., ge=1, le=4, description="Time slot number (1-4)")


class TeacherAvailabilityBulkCreate(BaseModel):
    """Bulk set availability: all (day, slot) pairs for a teacher."""
    user_id: int = Field(..., gt=0)
    availabilities: list[dict] = Field(
        ...,
        description="List of {day, slot_number} pairs",
        json_schema_extra={
            "example": [
                {"day": "monday", "slot_number": 1},
                {"day": "monday", "slot_number": 2},
                {"day": "wednesday", "slot_number": 1},
            ]
        },
    )


class TeacherAvailabilityResponse(BaseModel):
    id: int
    user_id: int
    day: TimetableEnum
    slot_number: int

    model_config = ConfigDict(from_attributes=True)


# ─── LECTURE GROUPS ─────────────────────────────


class LectureGroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    subject_id: int = Field(..., gt=0)
    semester: str | None = None
    assignment_ids: list[int] = Field(
        ..., min_length=2, description="Assignment IDs to group together"
    )


class LectureGroupResponse(BaseModel):
    id: int
    name: str
    subject_id: int
    semester: str | None = None
    members: list[dict] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ─── TASKS & DRAFTS ────────────────────────────


class TimetableTaskCreate(BaseModel):
    parameters: dict | None = Field(
        default_factory=dict,
        description="Generation parameters like semester, department_id",
    )


class TimetableTaskResponse(BaseModel):
    id: int
    status: TaskStatus
    parameters: dict | None = None
    error_message: str | None = None
    created_by: int | None = None

    model_config = ConfigDict(from_attributes=True)


class TimetableDraftResponse(BaseModel):
    id: int
    task_id: int
    assignment_id: int
    day: TimetableEnum
    start_time: time
    end_time: time
    room: str | None = None
    room_id: int | None = None

    # Joined fields
    teacher_name: str | None = None
    subject_name: str | None = None
    section_number: int | None = None

    model_config = ConfigDict(from_attributes=True)
