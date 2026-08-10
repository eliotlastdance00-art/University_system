import hmac
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import Response

from app.auth.email.service import send_otp_email
from app.auth.schemas import SaveRefreshToken, SendOtpRequest, VerifyOtpRequest
from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logger import get_domain_logger
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

from .exceptions import (
    AccountInactiveError,
    InvalidCredentialsError,
    InvalidOtpCodeError,
    InvalidOtpTokenError,
    InvalidRefreshPayloadError,
    InvalidRefreshTokenError,
    InvalidUserIdInTokenError,
    MissingOtpTokenError,
    OtpEmailMismatchError,
    RefreshTokenNotFoundError,
    TokenRevokedError,
)
from .repository import AuthRepository
from .schemas import LoginRequest, TokenResponse

logger = get_domain_logger("auth")

# Shared cookie attributes — MUST stay identical between set_cookie and
# delete_cookie, or the browser won't match the cookie to clear it.
OTP_COOKIE_KEY: str = "otp_token"
OTP_COOKIE_PATH: str = "/"
OTP_COOKIE_HTTPONLY: bool = True
OTP_COOKIE_SECURE: bool = False
OTP_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"


class AuthService:
    """Handles credential verification, OTP issuance/verification, and refresh-token lifecycle."""

    def __init__(self, conn):
        self.repo = AuthRepository(conn)
        self.user_repo = UsersRepository(conn)

    async def login(self, data: LoginRequest, response: Response):
        """Verify email/password, then trigger OTP issuance as the second factor."""
        try:
            user = await self.repo.get_user_for_login(data.email)
            if not user or not verify_password(user["password"], data.password):
                raise InvalidCredentialsError()

            if not user.get("is_active"):
                raise AccountInactiveError()

            email_address = user.get("email") or data.email
            otp_req = SendOtpRequest(email=email_address)

            await self.send_otp(request=otp_req, response=response)
            return {"message": "OTP code sent successfully. Please verify."}

        except AppError:
            raise
        except Exception as e:
            logger.error(
                "User login failed due to an unexpected error",
                extra={"error_detail": str(e), "email": data.email},
                exc_info=True,
            )
            raise AppError(f"Login Error: {e!s}") from e

    async def send_otp(self, request: SendOtpRequest, response: Response):
        """Generate an OTP, embed it in a signed short-lived token, email it, and cookie the token."""
        try:
            otp = create_otp()
            token = create_otp_token(request.email, otp)
            await send_otp_email(request.email, otp)

            response.set_cookie(
                key=OTP_COOKIE_KEY,
                value=token,
                path=OTP_COOKIE_PATH,
                httponly=OTP_COOKIE_HTTPONLY,
                secure=OTP_COOKIE_SECURE,
                samesite=OTP_COOKIE_SAMESITE,
            )
            return {"message": "OTP sent to email"}

        except AppError:
            raise
        except Exception as e:
            logger.error(
                "Failed to generate or send OTP email (dev mode fallback will log OTP to console)",
                extra={"email": request.email, "error_detail": str(e)},
                exc_info=True,
            )
            # YEREL GELİŞTİRME İÇİN GEÇİCİ ÇÖZÜM:
            # SMTP çalışmasa bile (Network/Port engeli), frontend 500 almasın diye
            # hatayı yutuyor ve OTP'yi console'a basıyoruz, böylece log'dan kopyalanabilir.
            print(f"==========================================")
            print(f"🔔 DEV MOCK - OTP CODE FOR {request.email}: {otp}")
            print(f"==========================================")
            
            # Hala cookie'yi ayarlamamız lazım ki verify_otp çalışsın
            response.set_cookie(
                key=OTP_COOKIE_KEY,
                value=token,
                path=OTP_COOKIE_PATH,
                httponly=OTP_COOKIE_HTTPONLY,
                secure=OTP_COOKIE_SECURE,
                samesite=OTP_COOKIE_SAMESITE,
            )
            return {"message": "OTP sent (or logged to console)"}

    async def verify_otp(
        self, request: VerifyOtpRequest, otp_token: str, response: Response
    ):
        """Validate the OTP against the cookie-bound token, then issue access + refresh tokens."""
        try:
            if not otp_token:
                raise MissingOtpTokenError()

            try:
                payload = decode_otp_token(otp_token)
            except Exception as e:
                raise InvalidOtpTokenError() from e

            if not payload or payload.get("type") != "otp_verification":
                raise InvalidOtpTokenError("Invalid token verification type")

            if payload["email"] != request.email:
                raise OtpEmailMismatchError()

            if not hmac.compare_digest(
                str(payload.get("otp", "")).encode(),
                str(request.otp or "").encode(),
            ):
                raise InvalidOtpCodeError()

            # BUG FIX: must match OTP_COOKIE_KWARGS exactly, or the delete is a no-op client-side.
            response.delete_cookie(
                key=OTP_COOKIE_KEY,
                path=OTP_COOKIE_PATH,
                httponly=OTP_COOKIE_HTTPONLY,
                secure=OTP_COOKIE_SECURE,
                samesite=OTP_COOKIE_SAMESITE,
            )

            user = await self.repo.get_user_for_login(request.email)
            if not user:
                from app.users.exceptions import UserNotFoundError

                raise UserNotFoundError()

            token_data = {"sub": str(user["id"]), "role": user["role"]}
            access_token = create_token(token_data)
            # BUG FIX: use the same claim shape ("sub" + "type") the rotation path in
            # refresh_token() expects. The old {"user_id":.., "type":"refresh"} shape
            # meant the very first refresh call after login would fail on payload.get("sub").
            refresh_token = create_refresh_token(
                {"sub": str(user["id"]), "type": "refresh"}
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

        except AppError:
            raise
        except Exception as e:
            logger.error(
                "OTP verification failed due to an unexpected error",
                extra={"email": request.email, "error_detail": str(e)},
                exc_info=True,
            )
            raise AppError("An unexpected error occurred during verification") from e

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """Rotate a valid, unrevoked refresh token for a new access + refresh token pair."""
        try:
            payload = decode_token(refresh_token)
            if not payload:
                raise InvalidRefreshTokenError()

            # Reject access tokens (or anything else) presented as a refresh token.
            if payload.get("type") != "refresh":
                raise InvalidRefreshPayloadError()

            user_id = payload.get("sub")
            if user_id is None:
                raise InvalidRefreshPayloadError()

            try:
                user_id_int = int(user_id)
            except (TypeError, ValueError) as e:
                raise InvalidUserIdInTokenError() from e

            user = await self.repo.get_user_for_login_by_id(user_id_int)
            if not user:
                from app.users.exceptions import UserNotFoundError

                raise UserNotFoundError()
            if not user["is_active"]:
                raise AccountInactiveError()

            token_row = await self.repo.get_refresh_token(refresh_token)
            if not token_row:
                raise RefreshTokenNotFoundError()
            if token_row.get("is_revoked"):
                raise TokenRevokedError()

            new_access_token = create_token(
                {"sub": str(user["id"]), "role": user["role"]}
            )
            # BUG FIX: rotated refresh token must carry the SAME claim shape as the
            # original issuance in verify_otp() — "sub" + "type", not "role".
            new_refresh_token = create_refresh_token(
                {"sub": str(user["id"]), "type": "refresh"}
            )

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
        except AppError:
            raise
        except Exception as e:
            logger.error(
                "Token rotation failed during refresh attempt",
                extra={"error_detail": str(e)},
                exc_info=True,
            )
            raise AppError("An unexpected error occurred during token refresh") from e

    async def logout(self, refresh_token: str):
        """Revoke the given refresh token, ending the session."""
        try:
            await self.repo.revoke_token(refresh_token)
            return {"detail": "Logout successful"}
        except AppError:
            raise
        except Exception as e:
            logger.error(
                "User logout failed",
                extra={"error_detail": str(e)},
                exc_info=True,
            )
            raise AppError("An error occurred during logout") from e
