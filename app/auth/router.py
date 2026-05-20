from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.auth.service import AuthService
from app.core.database import get_db

from .schemas import LoginRequest, TokenResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, conn: Connection = Depends(get_db)):
    service = AuthService(conn)
    return await service.login(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, conn: Connection = Depends(get_db)):
    service = AuthService(conn)
    return await service.refresh_token(refresh_token)


@router.post("/logout")
async def logout(refresh_token: str, conn: Connection = Depends(get_db)):
    service = AuthService(conn)
    return await service.logout(refresh_token)
