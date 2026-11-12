"""
QR Attendance Router — API Endpoints.
"""

from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends, Request

from app.academic.attendance.qr.schemas import (
    QrLiveScanItem,
    QrSessionCloseResponse,
    QrSessionRefreshResponse,
    QrSessionStartResponse,
    QrVerifyRequest,
    QrVerifyResponse,
)
from app.academic.attendance.qr.service import QrAttendanceService
from app.core.database import get_db
from app.core.dependencies import (
    admin_or_teacher,
    get_current_user,
    teacher_required,
)

router = APIRouter()

# Dependencies
TeacherUser = Annotated[dict, Depends(teacher_required)]
AdminOrTeacherUser = Annotated[dict, Depends(admin_or_teacher)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
DbConnection = Annotated[Connection, Depends(get_db)]


# ─── MUGALLYM (TEACHER) ENDPOINTS ────────────────────────────


@router.post(
    "/session/start/{lesson_id}",
    response_model=QrSessionStartResponse,
    summary="Start QR Session",
    description="Lesson üçin täze QR attendance session açýar.",
)
async def start_session(
    lesson_id: int,
    current_user: TeacherUser,
    conn: DbConnection,
):
    service = QrAttendanceService(conn)
    return await service.start_session(lesson_id, current_user)


@router.get(
    "/session/{session_id}/refresh",
    response_model=QrSessionRefreshResponse,
    summary="Refresh QR Token",
    description="Häzirki session üçin täze token we QR payload döredýär (rotation).",
)
async def refresh_token(
    session_id: int,
    current_user: TeacherUser,
    conn: DbConnection,
):
    service = QrAttendanceService(conn)
    return await service.refresh_token(session_id, current_user)


@router.post(
    "/session/{session_id}/close",
    response_model=QrSessionCloseResponse,
    summary="Close QR Session",
    description="Session-y ýapýar we scan etmedik studentleri absent hökmünde belleýär.",
)
async def close_session(
    session_id: int,
    current_user: TeacherUser,
    conn: DbConnection,
):
    service = QrAttendanceService(conn)
    return await service.close_session(session_id, current_user)


@router.get(
    "/session/{session_id}/live",
    response_model=list[QrLiveScanItem],
    summary="Live Scan Results",
    description="Bu session-da scan eden studentleriň wagty boýunça sanawy.",
)
async def live_scans(
    session_id: int,
    current_user: AdminOrTeacherUser,
    conn: DbConnection,
):
    service = QrAttendanceService(conn)
    return await service.get_live_scans(session_id, current_user)


# ─── STUDENT ENDPOINTS ───────────────────────────────────────


@router.post(
    "/verify",
    response_model=QrVerifyResponse,
    summary="Verify QR Token",
    description="Student QR-dan okan maglumatlaryny (session_id, token) iberip özüni present belleýär.",
)
async def verify_qr(
    payload: QrVerifyRequest,
    request: Request,
    current_user: CurrentUser,
    conn: DbConnection,
):
    # Device fingerprint we audit üçin headerleri alýarys
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = QrAttendanceService(conn)
    return await service.verify_qr(
        request=payload,
        current_user=current_user,
        client_ip=client_ip,
        user_agent=user_agent,
    )
