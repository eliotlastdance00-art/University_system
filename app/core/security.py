# -------------Password------------


# from passlib.context import CryptContext

# pwd_context = CryptContext(schemes=["bcrypt"])


# def hash_password(password: str) -> str:
#     return pwd_context.hash(password[:72])


# def verify_password(plain: str, hashed: str) -> bool:
#     bplain=plain[:72].encode('utf-8')
#     bhashed=hashed.encode('utf-8')
#     return pwd_context.verify(bplain, bhashed)
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Argon2 obýektini döredýäris
ph = PasswordHasher()

def hash_password(password: str) -> str:
    """Paroly Argon2 arkaly heşleýär"""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Parolyň dogrulygyny barlayýar"""
    try:
        # Argon2 bazadaky heşiň içinden 'salt'-y özi tapýar we barlayýar
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        # Eger parol gabat gelmese
        return False
    except Exception:
        # Başga bir ýalňyşlyk ýüze çyksa (meselem, format bozuk bolsa)
        return False

# -------------JWT--------------
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from app.core.config import settings


def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None

