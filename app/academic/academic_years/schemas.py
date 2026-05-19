from pydantic import BaseModel


class Acedemic_yearCreate(BaseModel):
    year_start:int
    year_end:int



class Acedemic_yearUpdate(BaseModel):
     year_start:int | None=None
     year_end:int   | None=None
     is_active:bool | None=None



class Acedemic_yearResponse(BaseModel):
     id:int
     year_start:int
     year_end:int
     is_active:bool 
