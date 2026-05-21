from fastapi import HTTPException

from app.profile.repository import ProfileRepository
from app.profile.schemas import UpdateProfile


class ProfileService:
    def __init__(self, conn):
        self.repo = ProfileRepository(conn)

    async def get_profile_me(self, user_id):
        result = await self.repo.get_profile_me(user_id)
        if not result:
            raise HTTPException(status_code=404, detail="Profile not found")
        return {k: v for k, v in result.items() if v is not None}
    

    async def update_profile_me(self, data: UpdateProfile):
        email_exists = await self.repo.get_profile_by_email(data.email)
        if email_exists and email_exists["id"] != data.id:
            raise HTTPException(
                status_code=400, 
                detail="Email already in use"
            )
        result = await self.repo.get_profile_me(data.id)
        if not result:
            raise HTTPException(status_code=404, detail="Profile not found")
        new_full_name = data.name or result["full_name"]
        new_email = data.email or result["email"]
        new_faculty_id = data.faculty_id or result["faculty_id"]
        new_department_id = data.department_id or result["department_id"]
        new_section_id = data.section_id or result["section_id"]
        await self.repo.update_profile_me(
            id=data.id,
            full_name=new_full_name,
            email=new_email,
            faculty_id=new_faculty_id,
            department_id=new_department_id,
            section_id=new_section_id,
        )

    async def update_password_me(self, id, new_password):
        await self.repo.update_password_me(id, new_password)
