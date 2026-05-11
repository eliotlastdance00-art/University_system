from fastapi import APIRouter,Depends
from aiomysql import Connection
from . import service 
from .schemas import TokenResponse,LoginRequest
from app.core.database import get_db



router=APIRouter(
    prefix="/auth",
    tags=["Auth"]
    
)



@router.post("/login",response_model=TokenResponse)
async def login(data:LoginRequest,conn:Connection=Depends(get_db)):
    return await  service.login(conn,data)