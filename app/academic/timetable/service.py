from fastapi import HTTPException, status
from app.academic.timetable.repository import TimetableRepository
from app.academic.timetable.schemas import TimetableCreate, TimetableUpdate,TimetableEnum
from app.academic.assignments.repository import AssignmentRepository




class TimetableService:
    def __init__(self, conn):
        self.conn = conn
        self.asrepo = AssignmentRepository(self.conn)
        self.repo = TimetableRepository(self.conn)




    async def get_or_404(self,id:int)->dict:
        result=await self.repo.get_by_id(id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found timetable"
            )
        return result
    


    async def check_time(self,start_time:str,end_time:str)->bool:
        if start_time>=end_time:
            return False
        return True
    async def check_teacher_conflict(self,user_id:int,day:str,start_time:str,exclude_id:int|None):
        conflict=await self.repo.teacher_conflict(user_id, day, start_time, exclude_id)
        if conflict:
            raise HTTPException(
                status_code = status.HTTP_409_CONFLICT,
                detail      = "Teacher has a scheduling conflict at this time."
            )
      


    async def _check_duplicate(self,assignment_id:int,day:str,start_time:str,exclude_id:int|None):
        existing= await  self.repo.exists(assignment_id,day, start_time, exclude_id)
        if existing:
            raise HTTPException(
                status_code = status.HTTP_409_CONFLICT,
                detail      = "This assignment has already been assigned to this timetable."
            )
        

    async def create(self, data: TimetableCreate) -> dict:
        assignment= await self.asrepo.get_by_id(data.assignment_id)
        if not assignment:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail      = "Not found assignment"
            )
        await self.check_time(data.start_time, data.end_time)
        await self._check_duplicate(
            assignment_id=data.assignment_id,
            day=data.day.value,
            start_time=str(data.start_time),
            exclude_id=None
                )
        
        await self.check_teacher_conflict(
            user_id=assignment["teacher_id"], 
            day=data.day.value,
            start_time=str(data.start_time),
            exclude_id=None
        )
       
        return await self.repo.create(data)
        

    async def get_all(self) -> list[dict]:
        all= await self.repo.get_all()
        if not all:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Timetable is empty"
            )
        return  all
    

    async def get_by_id(self,id:int)->dict:
        return await self.get_or_404(id)

    

    async def get_group(self,group_id:int)-> list[dict]:
        group=await self.repo.get_all_group_week(group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found group timetable"
            )
        return group
    


    async def get_day_group(self,day:TimetableEnum,group_id:int) ->list[dict]:
        result=await self.repo.get_day_group(group_id,day)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found this day for that group"
            )
        return result
    

    async def get_teacher_timetable(self,user_id:int) ->list[dict]:
        teacher= await self.repo.get_by_teacher(user_id)
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found teacher timetable"
            )
        return teacher
    



    async def get_teacher_timetable_day(self,user_id:int,day:str)->list[dict]:
        teacher=await self.repo.get_by_teacher_day(user_id,day)
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found this day timetable that teacher"
            )
        return teacher
    



    async def update(self, id:int,data: TimetableUpdate) -> dict:
        current= await self.get_or_404(id)
        if not current:
            raise HTTPException(
                status_code=404,
                detail="Not found timetable"
            )
        start_time=data.start_time or current["start_time"]
        end_time=data.end_time or current["end_time"]
        await self.check_time(start_time, end_time)

        if data.day or data.start_time:
            day=data.day.value if data.day else current["day"]
            start=str(data.start_time) if data.start_time else str(current["start_time"])

            await self._check_duplicate(
                assignment_id=current["assignment_id"], 
                day= day, 
                start_time=start, 
                exclude_id=id
                )
            await self.check_teacher_conflict(
                user_id=current["teacher_id"], 
                day=day, 
                start_time=start, 
                exclude_id=id
                )

        return await self.repo.update(id,data)
    




    async def delete(self,id:int) -> dict:
        timetable=await self.repo.get_by_id(id)
        if not timetable:
            raise HTTPException(
                status_code=404,
                detail="Not found timetable"
            )
        deleted=await self.repo.delete(id)
        if not deleted:
            raise HTTPException(
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail      = "Can not deleted"
            )
        return {"message": f"ID={id} succesfully deleted"}


    





    
        







