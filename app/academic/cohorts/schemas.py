from pydantic import BaseModel



class ChCreate(BaseModel):
    program_id:int
    academic_year_id:int



class ChUpdate(BaseModel):
    id:int
    program_id:int
    academic_year_id:int
