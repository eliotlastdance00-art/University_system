from pydantic import BaseModel



class FacultyCreate(BaseModel):
    name:str
    code:str


class FacultyUpdate(BaseModel):
    name:str| None=None    
    code:str| None=None


class FacultyResponse(BaseModel):
    id:int
    name:str
    code:str    