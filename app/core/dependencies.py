from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader

from app.core.security import decode_token

oauth2_scheme = APIKeyHeader(name="Authorization")
from typing import Annotated

# ─── Current User ───────────────────────────────────────────


async def get_current_user(
    token: str = Depends(oauth2_scheme),
):
    payload = decode_token(token)
    if payload:
        return payload
    raise HTTPException(status_code=401, detail="Invalid or expired token")


# ─── Identity helpers ────────────────────────────────────────

CurrentUser = Annotated[dict, Depends(get_current_user)]


def get_user_id(current_user: dict) -> int:
    """Return the authenticated user's integer ID from the JWT payload.

    The access-token stores ``user_id`` as a string in the ``sub`` claim
    (per the JWT spec).  All routers / services must call this helper
    instead of writing ``int(current_user["sub"])`` inline, so that any
    future change to the claim name or type is fixed in a single place.

    Raises:
        ValueError: if ``sub`` is missing or cannot be coerced to ``int``.
    """
    try:
        return int(current_user["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError(
            f"Cannot extract user ID from token payload: {exc}"
        ) from exc



async def admin_required(current_user: CurrentUser):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def dean_required(current_user: CurrentUser):
    if current_user.get("role") != "dean":
        raise HTTPException(status_code=403, detail="Dean access required")
    return current_user


async def admin_or_dean(current_user: CurrentUser):
    if current_user.get("role") not in ["admin", "dean"]:
        raise HTTPException(status_code=403, detail="Admin or Dean access required")
    return current_user


async def teacher_required(current_user: CurrentUser):
    if current_user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    return current_user


async def admin_or_student(current_user: CurrentUser):
    if current_user.get("role") not in ["admin", "student"]:
        raise HTTPException(status_code=403, detail="Admin or Student access required")
    return current_user


async def admin_or_teacher(current_user: CurrentUser):
    if current_user.get("role") not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Admin or Teacher access required")
    return current_user


# ─── Pagination ─────────────────────────────────────────────


class PaginationParams:
    """Reusable pagination dependency.

    Usage in router:
        async def list_items(pagination: PaginationParams = Depends()):
            offset = pagination.offset
            limit  = pagination.limit
    """

    def __init__(self, page: int = 1, page_size: int = 20):
        page = max(page, 1)
        if page_size < 1:
            page_size = 1
        elif page_size > 100:
            page_size = 100
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size
        self.limit = page_size
