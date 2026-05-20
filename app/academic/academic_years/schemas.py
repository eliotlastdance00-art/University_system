from pydantic import BaseModel


class Academic_yearCreate(BaseModel):
    year_start:int
    year_end:int



class Academic_yearUpdate(BaseModel):
     id:int
     year_start:int | None=None
     year_end:int   | None=None
     is_active:bool | None=None



class Academic_yearResponse(BaseModel):
     id:int
     year_start:int
     year_end:int
     is_active:bool 
