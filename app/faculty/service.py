from  app.faculty.repository import FacultyRepository
from  .schemas import FacultyCreate,FacultyUpdate,FacultyResponse
from fastapi import HTTPException




class FacultyService:
    def __init__(self,conn):
        self.conn = conn
        self.repo = FacultyRepository(self.conn)
    #     Created faculty
    async def create_faculty(self,data:FacultyCreate)-> list[dict]:
        existing=await self.repo.get_faculty_by_code(data.code)
        if existing:
            raise HTTPException(
            status_code=400,
            detail="Faculty is already existing!"
        )
        await self.repo.create_faculty(data.name,data.code)
        faculty=await self.repo.get_faculty_by_code(data.code)
        return FacultyResponse(**faculty)

        
    


    #    Get all faculty
    async def get_all_faculty(self)-> list[dict]:
        faculties=await self.repo.get_all_faculty()
        if not faculties:
            return []
        return faculties
    


    #Get {id} faculty
    async def get_faculty_id(self,faculty_id)-> list[dict]:
        faculty=await self.repo.get_faculty_by_id(faculty_id)
        if not faculty:
            raise HTTPException(
            status_code=404,
            detail="Not found this faculty!"
        )
        return faculty


    #    Update faculty        
    async def update_faculty(self,faculty_id:int,data:FacultyUpdate)-> list[dict]:
        faculty=await self.repo.get_faculty_by_id(faculty_id)
        if not faculty:
            raise HTTPException(
            status_code=404,
            detail="Not found this faculty!"
            )
        new_name=data.name if  data.name else  faculty["name"]
        new_code=data.code if  data.code else  faculty["code"]
        await self.repo.update_faculty(faculty_id,new_name,new_code)
        return {"message":"Changed Faculty"}





    #.     Delete faculty
    async def delete_faculty(self,faculty_id):
        faculty= await self.repo.get_faculty_by_id(faculty_id)
        if not faculty:
            raise HTTPException(
            status_code=404,
            detail="Not found that faculty!!!"
        )
        await self.repo.delete_faculty(faculty_id)
        return {"message":"Succesfull delleted this faculty."}






























