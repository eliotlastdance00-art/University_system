import hmac
import logging

logger = logging.getLogger(__name__)
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Response, status

from app.auth.email.service import send_otp_email
from app.auth.schemas import SaveRefreshToken, SendOtpRequest, VerifyOtpRequest
from app.core.config import settings
from app.core.security import (
    create_otp,
    create_otp_token,
    create_refresh_token,
    create_token,
    decode_otp_token,
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

    async def login(self, data: LoginRequest, response: Response):
        try:
            user = await self.repo.get_user_for_login(data.email)
            if not user or not verify_password(user["password"], data.password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password",
                )

            if not user.get("is_active"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive"
                )

            email_address = user.get("email") or data.email
            otp_req = SendOtpRequest(email=email_address)

            await self.send_otp(request=otp_req, response=response)
            return {"message": "OTP code sent successfully. Please verify."}

        except HTTPException:
            raise
        except Exception as e:
            print(f"LOGIN ERROR: {e!s}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Login Error: {e!s}",
            ) from e

    async def send_otp(self, request: SendOtpRequest, response: Response):
        try:
            # 1. Ilki bilen OTP koduny döredýäris
            otp = create_otp()

            # 2. Döredilen OTP we email esasynda JWT token dörýär
            token = create_otp_token(request.email, otp)

            # 3. Email arkaly ulanyja ugradylýar
            await send_otp_email(request.email, otp)

            # 4. Cookie goýulýar
            response.set_cookie(
                key="otp_token",
                value=token,
                httponly=True,
                secure=False,
                samesite="lax",
                path="/",
            )
            return {"message": "OTP sent to email"}

        except HTTPException:
            raise
        except Exception as e:
            # Terminalda jikme-jik görmek üçin
            logger.exception("Send OTP Error occurred")

            # WAGTLAÝYNÇA: Ekrana hakyky ýalňyşlygy çykarýarys (Mysal üçin: FileNotFoundError ýa-da SMTP Authentication Error)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send OTP email. Internal Error: {e!s}",
            ) from e

    async def verify_otp(
        self, request: VerifyOtpRequest, otp_token: str, response: Response
    ):
        try:
            if not otp_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing OTP token"
                )

            try:
                payload = decode_otp_token(otp_token)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="OTP token expired or invalid",
                ) from e

            if not payload or payload.get("type") != "otp_verification":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token verification type",
                )

            if payload["email"] != request.email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Email mismatch"
                )

            if not hmac.compare_digest(str(payload.get("otp", "")).encode(), str(request.otp or "").encode()):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP code"
                )

            response.delete_cookie(
                key="otp_token", path="/", httponly=True, secure=True, samesite="strict"
            )

            user = await self.repo.get_user_for_login(request.email)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            token_data = {"sub": str(user["id"]), "role": user["role"]}
            access_token = create_token(token_data)
            refresh_token = create_refresh_token(
                {"user_id": user["id"], "type": "refresh"}
            )

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
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred during verification",
            ) from e

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
            if not payload:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token",
                )

            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token payload",
                )

            try:
                user_id_int = int(user_id)
            except (TypeError, ValueError) as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid user id in token",
                ) from e

            user = await self.user_repo.get_by_id_users(user_id_int)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Not found User"
                )
            if not user["is_active"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="User inactive"
                )

            token_row = await self.repo.get_refresh_token(refresh_token)
            if not token_row:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token not found",
                )
            if token_row.get("is_revoked"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is revoked"
                )

            new_data = {"sub": str(user["id"]), "role": user["role"]}
            new_access_token = create_token(new_data)
            new_refresh_token = create_refresh_token(new_data)

            new_expires_at = datetime.now(timezone.utc) + timedelta(
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
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred during token refresh",
            ) from e

    async def logout(self, refresh_token: str):
        try:
            await self.repo.revoke_token(refresh_token)
            return {"detail": "Logout successful"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred during logout",
            ) from e
