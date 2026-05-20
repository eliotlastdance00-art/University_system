from datetime import datetime, timedelta, timezone
from app.auth.schemas import SaveRefreshToken
from fastapi import HTTPException

from app.core.config import settings
from app.core.security import (
    create_refresh_token,
    create_token,
    decode_token,
    verify_password,
)
from app.users.repository import UsersRepository

from .repository import AuthRepository
from .schemas import LoginRequest, TokenResponse


class AuthService:
    def __init__(self, conn):
        self.repo = AuthRepository(conn)
        self.user_repo = UsersRepository(conn)

    async def login(self, data: LoginRequest):
        # TODO: Align claims between access/refresh tokens (e.g. consistently use "sub" vs "user_id")
        # TODO: Enforce and validate "type": "refresh" claim for refresh tokens to prevent misuse
        # TODO: Consider rate limiting / lockout on repeated failed logins at the API or service layer
        user = await self.repo.get_user_for_login(data.email)
        if not user:
            raise HTTPException(status_code=404, detail="Not found User")
        if not user["is_active"]:
            raise HTTPException(status_code=403, detail="Account is not active")
        is_valid = verify_password(data.password, user["password"])
        if not is_valid:
            raise HTTPException(status_code=401, detail="Wrong password")
        token_data = {"sub": str(user["id"]), "role": user["role"]}
        access_token = create_token(token_data)
        refresh_token = create_refresh_token({"user_id": user["id"], "type": "refresh"})
        expire_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        refresh_data = SaveRefreshToken(
            user_id=user["id"],
            token=refresh_token,
            expires_at=expire_at,
            is_revoked=False,
        )
        await self.repo.save_refresh_token(refresh_data)
        return TokenResponse(
            access_token=access_token, refresh_token=refresh_token, token_type="bearer"
        )

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        # TODO: Standardize refresh-token payload (e.g. consistently use "sub" or "user_id" and include "type": "refresh")
        # TODO: Explicitly validate the "type" claim to ensure only refresh tokens are accepted here
        # TODO: Consider refresh token rotation strategy (one-time use vs allowing multiple valid tokens per user)
        # TODO: Add additional checks for token reuse / replay (e.g. detect when an already-rotated token is used)
        # TODO: Log security-relevant events (invalid token, revoked token, inactive user) for audit and monitoring
        # TODO: Evaluate shortening refresh token lifetime and enforcing stricter revocation policies if needed

        payload = decode_token(refresh_token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token payload")

        try:
            user_id_int = int(user_id)
        except (TypeError, ValueError) as e:
            raise HTTPException(
                status_code=401, detail="Invalid user id in token"
            ) from e

        user = await self.user_repo.get_by_id_users(user_id_int)
        if not user:
            raise HTTPException(status_code=404, detail="Not found User")
        if not user["is_active"]:
            raise HTTPException(status_code=403, detail="User inactive")

        token_row = await self.repo.get_refresh_token(refresh_token)
        if not token_row:
            raise HTTPException(status_code=401, detail="Refresh token not found")
        if token_row.get("is_revoked"):
            raise HTTPException(status_code=401, detail="Token is revoked")

        new_data = {"sub": str(user["id"]), "role": user["role"]}
        new_access_token = create_token(new_data)
        new_refresh_token = create_refresh_token(new_data)
        new_expires_at = datetime.now() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        await self.repo.old_token_change_new_token(
            new_token=new_refresh_token,
            old_token=refresh_token,
            expires_at=new_expires_at,
        )
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
        )




    async def logout(self, refresh_token: str):
        # TODO: Decode and validate refresh token, and ensure it belongs to the current user before revocation
        # TODO: Decide and document behavior when token is already expired or not found (idempotent logout vs error)

        await self.repo.revoke_token(refresh_token)
        return {"detail": "Logout successful"}


