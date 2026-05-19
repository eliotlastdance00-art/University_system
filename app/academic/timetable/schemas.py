from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from typing import Optional, List
from datetime import time

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
        ..., 
        description="Lesson start time", 
        json_schema_extra={"example": "09:00:00"}
    )
    end_time: time = Field(
        ..., 
        description="Lesson end time", 
        json_schema_extra={"example": "10:30:00"}
    )
    
    room: str = Field(..., min_length=1, description="Room number or name")
    model_config = ConfigDict(from_attributes=True)


# ─── CREATE ─────────────────────────────────────

class TimetableCreate(TimetableBase):
    pass

# ─── UPDATE ─────────────────────────────────────

class TimetableUpdate(BaseModel):
    assignment_id: Optional[int] = Field(None, gt=0)
    day: Optional[TimetableEnum] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[str] = Field(None, min_length=1)

# ─── RESPONSE ───────────────────────────────────

class TimetableResponse(TimetableBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# ─── DETAIL RESPONSE (JOIN) ─────────────────────

class TimetableDetailResponse(BaseModel):
    id: int
    #Assignment
    assignment_id:int
    semester:SemesterEnum

    #Teacher
    teacher_id:int
    teacher_name:str

    #Subject
    subject_id:int
    subject_name:str

    #Group
    section_id:int
    group_name:str

    

    model_config = ConfigDict(from_attributes=True)



class GroupResponse(BaseModel):
    assignment_id: int = Field(..., gt=0, description="Assignment id")
    day: TimetableEnum = Field(..., description="Week days")
    start_time: time = Field(
        ..., 
        description="Lesson start time", 
        json_schema_extra={"example": "09:00:00"}
    )
    end_time: time = Field(
        ..., 
        description="Lesson end time", 
        json_schema_extra={"example": "10:30:00"}
    )
    
    room: str = Field(..., min_length=1, description="Room number or name")
    model_config = ConfigDict(from_attributes=True)
    teacher_name:str
    group_name:str