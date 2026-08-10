from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.core.audit_log import AuditLogger
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.notifications.repository import (
    AudienceRepository,
    DeviceTokenRepository,
    NotificationLogRepository,
)
from app.notifications.schemas import (
    BroadcastRequest,
    BroadcastResponse,
    DeviceTokenRegisterRequest,
    NotificationOut,
)
from app.notifications.service import NotificationService

router = APIRouter()


CurrentUser = Annotated[dict, Depends(get_current_user)]
DbConnection = Annotated[Connection, Depends(get_db)]


def _build_service(conn: Connection) -> NotificationService:
    return NotificationService(
        audience_repo=AudienceRepository(conn),
        token_repo=DeviceTokenRepository(conn),
        log_repo=NotificationLogRepository(conn),
        audit_logger=AuditLogger(conn),
    )


@router.post("/register-token")
async def register_device_token(
    data: DeviceTokenRegisterRequest,
    current_user: CurrentUser,
    conn: DbConnection,
) -> None:
    service = _build_service(conn)
    # JWT payload stores user_id in "sub" as str — convert to int
    await service.register_device_token(
        get_user_id(current_user), data.token, data.device_type
    )


@router.post("/broadcast", response_model=BroadcastResponse)
async def broadcast_notification(
    data: BroadcastRequest,
    current_user: CurrentUser,
    conn: DbConnection,
) -> BroadcastResponse:
    """
    sender_id current_user-den (JWT) alynýar, request body-de sender_id ýok —
    şeýdip iberiji özüni başga birine öýnedip bilmez.
    """
    service = _build_service(conn)
    # current_user["sub"] is stored as str(user_id) in the JWT.
    # Convert to int to match the DB column type and other endpoints that use current_user["id"].
    sent_count = await service.broadcast(
        sender_id=get_user_id(current_user),
        title=data.title,
        body=data.body,
        target_role=data.target_role,
    )
    return BroadcastResponse(sent_count=sent_count)


@router.get("/", response_model=list[NotificationOut])
async def get_my_notifications(
    current_user: CurrentUser,
    conn: DbConnection,
    limit: int = 20,
    offset: int = 0,
) -> list[NotificationOut]:
    service = _build_service(conn)
    return await service.get_notifications_for_user(get_user_id(current_user), limit, offset)


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> None:
    service = _build_service(conn)
    await service.mark_as_read(notification_id, get_user_id(current_user))
