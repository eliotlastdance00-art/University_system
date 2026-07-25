from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.core.dependencies import get_current_user

from .schemas import UpdateProfile
from .services import ProfileService

router = APIRouter()


# router.py
@router.put("/me")
async def update_profile(
    data: UpdateProfile,
    current_user=Depends(get_current_user),
    conn: Connection = Depends(get_db),
):
    user_id = current_user["sub"]
    service = ProfileService(conn)
    return await service.update_profile(user_id, data)


@router.get("/me")
async def get_profile(
    current_user=Depends(get_current_user), conn: Connection = Depends(get_db)
):
    user_id = current_user["sub"]
    service = ProfileService(conn)
    return await service.get_profile_me(user_id)


@router.put("/me/password")
async def update_password(
    new_password: str,
    current_user=Depends(get_current_user),
    conn: Connection = Depends(get_db),
):
    user_id = current_user["sub"]
    service = ProfileService(conn)
    return await service.update_password(user_id, new_password)
