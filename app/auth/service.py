from fastapi import HTTPException
from . import repository
from .schemas import LoginRequest,TokenResponse
from app.core.security import verify_password,create_token



async def login(conn,data:LoginRequest):
    user= await repository.get_user_for_login(conn,data.email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Not found User"
        )
    if not user["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="Account is not active"
        )
    is_valid=verify_password(data.password,user["password"])
    if not is_valid:
        raise HTTPException(
            status_code=401,
            detail="Wrong password"
        )
    token=create_token({
        "user_id":user["id"],
        "role":user["role"]
    })
    return TokenResponse(access_token=token)