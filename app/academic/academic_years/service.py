from app.academic.academic_years.repository import AcedemicYearRepository
from app.academic.academic_years.schemas import Acedemic_yearCreate,Acedemic_yearResponse



class AcademicYearService:
    def __init__(self,conn):
        self.conn = conn
        self.repo = AcedemicYearRepository(self.conn)


    async def create(self,data:Acedemic_yearCreate)->Acedemic_yearResponse:
        result=await self.repo.create(data)
        return Acedemic_yearResponse(**result)    


        



