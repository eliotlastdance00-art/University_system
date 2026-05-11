from pydantic import BaseModel




class DepartmentCreate(BaseModel):
    name:str
    faculty_id:int
   




class DepartmentUpdate(BaseModel):
    name:str | None=None
    faculty_id:int | None=None



class DepartmentResponse(BaseModel):
    id:int
    name:str 
    faculty_id:int
    faculty_name:str


    
