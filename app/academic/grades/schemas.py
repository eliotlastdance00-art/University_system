from datetime import datetime

from pydantic import BaseModel, Field


class GradeBase(BaseModel):
    student_id: int = Field(..., gt=0, description="ID of the student")
    subject_id: int = Field(..., gt=0, description="ID of the subject")
    assignment_id: int | None = Field(
        None, gt=0, description="ID of the assignment (if any)"
    )
    score: float = Field(..., ge=0, description="Grade score")
    max_score: float = Field(100.0, gt=0, description="Maximum possible score")
    weight: float = Field(1.0, gt=0, description="Weight of this grade")
    comment: str | None = None


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    score: float | None = Field(None, ge=0)
    max_score: float | None = Field(None, gt=0)
    weight: float | None = Field(None, gt=0)
    comment: str | None = None


class GradeResponse(GradeBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
