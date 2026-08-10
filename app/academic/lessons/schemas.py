from datetime import date
from enum import Enum

from pydantic import BaseModel

# ─── ENUM ───────────────────────────────────────────────────


class LessonStatusEnum(str, Enum):
    completed = "completed"
    cancelled = "cancelled"


# ─── RESPONSE ───────────────────────────────────────────────


class LessonResponse(BaseModel):
    id: int
    timetable_id: int
    date: date
    status: LessonStatusEnum
    note: str | None
    subject_name: str
    group_name: str
    teacher_name: str

    class Config:
        from_attributes = True


# ─── CANCEL ─────────────────────────────────────────────────


class LessonCancel(BaseModel):
    note: str | None


# ─── STATS ──────────────────────────────────────────────────


class LessonStatsResponse(BaseModel):
    total: int
    completed: int
    cancelled: int
