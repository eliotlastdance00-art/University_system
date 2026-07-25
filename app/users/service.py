from fastapi import HTTPException, status

from .repository import UsersRepository
from .schemas import UserCreate, UserResponse, UserUpdate


class UserService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = UsersRepository(self.conn)

    async def _get_or_404(self, id: int) -> dict:
        """Kullanıcı varlığını kontrol eden ortak helper metot."""
        user = await self.repo.get_by_id_users(id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Not found user"
            )
        return user

    async def user_create(self, data: UserCreate) -> UserResponse:
        existing_user = await self.repo.get_by_email_users(data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="That email already created",
            )

        if not data.password or len(data.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is too short! It must be at least 8 characters long.",
            )

        await self.repo.create_user(data.full_name, data.email, data.password)
        created_user = await self.repo.get_by_email_users(data.email)
        return UserResponse(**created_user)

    async def get_all(self) -> list[UserResponse]:
        users = await self.repo.get_all_users()
        return [UserResponse(**u) for u in users]

    async def get_user_by_id(self, user_id: int) -> UserResponse:
        user = await self._get_or_404(user_id)
        return UserResponse(**user)

    async def update_user(self, id: int, data: UserUpdate) -> dict:
        current_user = await self._get_or_404(id)

        # Gönderilmeyen alanlar için mevcut veriyi koru
        new_full_name = (
            data.full_name if data.full_name is not None else current_user["full_name"]
        )
        new_email = data.email if data.email is not None else current_user["email"]
        new_is_active = (
            data.is_active if data.is_active is not None else current_user["is_active"]
        )

        if data.password is not None:
            await self.repo.update_user(
                id, new_full_name, new_email, data.password, new_is_active
            )
        else:
            await self.repo.update_user_without_password(
                id, new_full_name, new_email, new_is_active
            )
        return {"message": "Changed user ✅"}

    async def delete_user(self, id: int) -> dict:
        await self._get_or_404(id)
        await self.repo.delete_user(id)
        return {"message": "Delete user ✅"}

    async def give_role(
        self,
        user_id: int,
        role_id: int,
        faculty_id: int = None,
        department_id: int = None,
        section_id: int = None,
    ) -> dict:
        await self._get_or_404(user_id)

        role = await self.repo.role_by_id(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Not found ROLE"
            )

        existing_role = await self.repo.get_user_role(user_id, role_id)
        if existing_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Role already taken"
            )

        await self.repo.assign_role(user_id, role_id)
        await self.repo.assign_profile(user_id, faculty_id, department_id, section_id)
        return {"message": "Successfully given role"}

    async def show_roles(self, user_id: int) -> list:
        await self._get_or_404(user_id)
        return await self.repo.get_user_roles_all(user_id)

    async def delete_role(self, user_id: int, role_id: int) -> dict:
        await self._get_or_404(user_id)

        existing_role = await self.repo.get_user_role(user_id, role_id)
        if not existing_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have this role",
            )

        await self.repo.remove_role(user_id, role_id)
        return {"message": "Role successfully removed"}

    async def search_users(
        self,
        name: str = None,
        role: str = None,
        faculty_id: int = None,
        department_id: int = None,
        section_id: int = None,
    ) -> list[UserResponse]:
        return [
            UserResponse(**u)
            for u in await self.repo.search_users(
                name=name,
                role=role,
                faculty_id=faculty_id,
                department_id=department_id,
                section_id=section_id,
            )
        ]

    async def assign_section(self, user_id: int, section_id: int):

        user = await self.repo.get_by_id_users(user_id)
        if not user:
            raise HTTPException(404, "Not found user")

        role = await self.repo.get_role_by_name("student")
        if not role:
            raise HTTPException(400, "Student role not found in system")
            
        is_student = await self.repo.get_user_role(user_id, role["id"])
        if not is_student:
            raise HTTPException(400, "This user is not a student")

        section = await self.repo.get_section_by_id(section_id)
        if not section:
            raise HTTPException(404, "Not found section")

        count = await self.repo.get_section_student_count(section_id)
        if count["total"] >= section["capacity"]:
            raise HTTPException(400, "Section is full")

        await self.repo.update_user_section(user_id, section_id)
        return {"success": "Student assigned to section successfully"}
