from pydantic import BaseModel





class GroupCreate(BaseModel):
    name:str
    department_id:int

class GroupUpdate(BaseModel):
    name:str | None=None
    department_id:int |None=None

class GroupResponse(BaseModel):
    id:int
    name:str
    department_id:int        
    department_name:str