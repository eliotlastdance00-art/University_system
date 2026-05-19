from fastapi import APIRouter,Depends
from aiomysql import Connection
from . import service 
from .schemas import TokenResponse,LoginRequest
from app.core.database import get_db



router=APIRouter(
)



@router.post("/login",response_model=TokenResponse)
async def login(data:LoginRequest,conn:Connection=Depends(get_db)):
    return await  service.login(conn,data)


@router.post("/refresh",response_model=TokenResponse)
async def refresh_token(refresh_token:str,conn:Connection=Depends(get_db)):
    return await service.refresh_token(conn,refresh_token)


@router.post("/logout")
async def logout(refresh_token:str,conn:Connection=Depends(get_db)):
    return await service.logout(conn,refresh_token)