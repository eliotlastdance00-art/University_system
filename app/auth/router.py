from aiomysql import Connection
from fastapi import APIRouter, Depends, Response

from app.auth.service import AuthService
from app.core.database import get_db
# Gerekli funksiýalary we shemalary import edýäris
from app.core.security import get_otp_token 
from .schemas import LoginRequest, VerifyOtpRequest, TokenResponse

router = APIRouter()


@router.post("/login")
async def login(
    data: LoginRequest, 
    response: Response, # FastAPI-dan Response obýektini alýarys (Cookie goýmak üçin)
    conn: Connection = Depends(get_db)
):
    service = AuthService(conn)
    return await service.login(data, response)


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(
    request: VerifyOtpRequest,
    response: Response,
    otp_token: str = Depends(get_otp_token), # Cookie-den otp_token-i FastAPI arkaly okaýarys
    conn: Connection = Depends(get_db)
):
    service = AuthService(conn)
    # Tutulan otp_token-i adaty string hökmünde service-e berýäris
    return await service.verify_otp(request, otp_token,response)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, conn: Connection = Depends(get_db)):
    service = AuthService(conn)
    return await service.refresh_token(refresh_token)


@router.post("/logout")
async def logout(refresh_token: str, conn: Connection = Depends(get_db)):
    service = AuthService(conn)
    return await service.logout(refresh_token)