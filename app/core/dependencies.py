from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader
from app.core.security import decode_token

oauth2_scheme =APIKeyHeader(name="Authorization")

# Häzirki useri al
async def get_current_user(
    token: str = Depends(oauth2_scheme),
):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Wrong token or finshed time"
        )
    return payload

# Diňe Admin
async def admin_required(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Just only exit admin"
        )
    return current_user

# Diňe Dean
async def dean_required(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "dean":
        raise HTTPException(
            status_code=403,
            detail="Just only exit dean"
        )
    return current_user

# Admin ýa-da Dean
async def admin_or_dean(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "dean"]:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized"
        )
    return current_user



async def teacher_required(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Just only exit teacher"
        )
    return current_user