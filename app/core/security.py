import secrets
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Cookie, HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings

# Argon2 obýektini döredýäris
ph = PasswordHasher()


def hash_password(password: str) -> str:
    """Paroly Argon2 arkaly heşleýär"""
    return ph.hash(password)


def verify_password(hashed_password: str, plain_password: str) -> bool:
    """Parolyň dogrulygyny barlayýar"""
    try:
        # Argon2 bazadaky heşiň içinden 'salt'-y özi tapýar we barlayýar
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        # Eger parol gabat gelmese
        return False
    except Exception:  # noqa: BLE001
        # Başga bir ýalňyşlyk ýüze çyksa (meselem, format bozuk bolsa)
        return False


# -------------JWT AccessToken--------------


def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


# -------------JWT Refresh Token--------------


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_otp() -> str:
    return str(100000 + secrets.randbelow(900000))


def create_otp_token(email: str, otp: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    payload = {
        "email": email,
        "otp": otp,
        "exp": expire,
        "type": "otp_verification",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_otp_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


def get_otp_token(otp_token: str | None = Cookie(default=None)) -> str:
    if not otp_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not found OTP token in cookies.",
        )
    return otp_token
