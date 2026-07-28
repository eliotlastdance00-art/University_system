from enum import Enum

from pydantic import BaseModel

# ─── ENUM ───────────────────────────────────────────────────


class AttendanceStatusEnum(str, Enum):
    present = "present"
    absent = "absent"


# ─── SINGLE RECORD ──────────────────────────────────────────


class AttendanceRecord(BaseModel):
    student_id: int
    status: AttendanceStatusEnum


# ─── BULK CREATE ────────────────────────────────────────────


class AttendanceBulkCreate(BaseModel):
    records: list[AttendanceRecord]


# ─── UPDATE ─────────────────────────────────────────────────


class AttendanceUpdate(BaseModel):
    status: AttendanceStatusEnum


# ─── RESPONSE ───────────────────────────────────────────────


class AttendanceResponse(BaseModel):
    id: int
    lesson_id: int
    student_id: int
    student_name: str
    status: AttendanceStatusEnum

    class Config:
        from_attributes = True


# ─── STATS ──────────────────────────────────────────────────


class AttendanceStatsResponse(BaseModel):
    total: int | None
    present: int | None
    absent: int | None
    percentage: float | None
