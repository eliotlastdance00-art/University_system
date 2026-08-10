from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.core.dependencies import get_current_user

from .schemas import UpdatePassword, UpdateProfile
from .services import ProfileService

router = APIRouter()
CurrentUser = Annotated[dict, Depends(get_current_user)]
DbConnection = Annotated[Connection, Depends(get_db)]


# router.py
@router.put("/me")
async def update_profile(
    data: UpdateProfile,
    current_user: CurrentUser,
    conn: DbConnection,
):

    service = ProfileService(conn)
    return await service.update_profile_me(data)


@router.get("/me")
async def get_profile(current_user: CurrentUser, conn: DbConnection):
    user_id = get_user_id(current_user)
    service = ProfileService(conn)
    return await service.get_profile_me(user_id)


@router.put("/me/password")
async def update_password(
    data: UpdatePassword,
    current_user: CurrentUser,
    conn: DbConnection,
):
    user_id = get_user_id(current_user)
    service = ProfileService(conn)
    return await service.update_password_me(user_id, data.new_password)
