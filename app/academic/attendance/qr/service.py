"""
QR Attendance Service — Business logic we validation.
"""

from datetime import datetime, timezone

from app.academic.attendance.exceptions import (
    NotLessonOwnerError,
    QrAlreadyScannedError,
    QrNotEnrolledError,
    QrSessionAlreadyActiveError,
    QrSessionClosedError,
    QrSessionNotFoundError,
    QrTokenExpiredError,
    QrTokenInvalidError,
)
from app.academic.attendance.qr.repository import QrSessionRepository
from app.academic.attendance.qr.schemas import (
    QrLiveScanItem,
    QrSessionCloseResponse,
    QrSessionRefreshResponse,
    QrSessionStartResponse,
    QrVerifyRequest,
    QrVerifyResponse,
)
from app.academic.attendance.qr.token_manager import (
    TOKEN_LIFETIME_SECONDS,
    build_qr_payload,
    compute_device_hash,
    generate_token,
    token_expiry,
)
from app.core.dependencies import get_user_id


class QrAttendanceService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = QrSessionRepository(self.conn)

    # ─── KÖMEKÇI ────────────────────────────────────────────

    async def _check_lesson_owner(self, lesson_id: int, user_id: int):
        """Mugallym şu sapagyň eýesimi barlamak."""
        is_owner = await self.repo.is_lesson_owner(lesson_id, user_id)
        if not is_owner:
            raise NotLessonOwnerError()

    async def _get_session_or_404(self, session_id: int) -> dict:
        """Session tapylmasa QrSessionNotFoundError atýar."""
        session = await self.repo.get_session_by_id(session_id)
        if not session:
            raise QrSessionNotFoundError()
        return session

    # ─── START SESSION ───────────────────────────────────────

    async def start_session(
        self, lesson_id: int, current_user: dict
    ) -> QrSessionStartResponse:
        teacher_id = get_user_id(current_user)
        await self._check_lesson_owner(lesson_id, teacher_id)

        # Öň açyk session barmy?
        active_session = await self.repo.get_active_session_by_lesson(lesson_id)
        if active_session:
            raise QrSessionAlreadyActiveError()

        token = generate_token()
        expires_at = token_expiry()

        session_id = await self.repo.create_session(
            lesson_id=lesson_id,
            teacher_id=teacher_id,
            token=token,
            token_expires_at=expires_at,
        )

        qr_data = build_qr_payload(session_id, token)

        return QrSessionStartResponse(
            session_id=session_id,
            qr_data=qr_data,
            expires_in=TOKEN_LIFETIME_SECONDS,
        )

    # ─── REFRESH TOKEN (ROTATION) ────────────────────────────

    async def refresh_token(
        self, session_id: int, current_user: dict
    ) -> QrSessionRefreshResponse:
        session = await self._get_session_or_404(session_id)

        # Diňe eýesi refresh edip bilýär
        await self._check_lesson_owner(session["lesson_id"], get_user_id(current_user))

        if session["status"] != "active":
            raise QrSessionClosedError()

        # Täze token we möhlet
        new_token = generate_token()
        new_expires_at = token_expiry()

        await self.repo.update_token(session_id, new_token, new_expires_at)

        qr_data = build_qr_payload(session_id, new_token)
        present_count = await self.repo.get_present_count(session_id)

        return QrSessionRefreshResponse(
            qr_data=qr_data,
            expires_in=TOKEN_LIFETIME_SECONDS,
            present_count=present_count,
        )

    # ─── CLOSE SESSION ───────────────────────────────────────

    async def close_session(
        self, session_id: int, current_user: dict
    ) -> QrSessionCloseResponse:
        session = await self._get_session_or_404(session_id)
        lesson_id = session["lesson_id"]

        await self._check_lesson_owner(lesson_id, get_user_id(current_user))

        if session["status"] == "active":
            await self.repo.close_session(session_id)

        # Bu sapaga degişli ähli studentleri al
        all_students = await self.repo.get_all_lesson_students(lesson_id)
        scanned_students = await self.repo.get_scanned_students(session_id)

        scanned_ids = {s["student_id"] for s in scanned_students}

        # Köne tablisa üçin sync işlemleri (present we absent)
        present_count = 0
        absent_count = 0

        for student in all_students:
            student_id = student["student_id"]
            if student_id in scanned_ids:
                status = "present"
                present_count += 1
            else:
                status = "absent"
                absent_count += 1

            # Köne attendance tablisasyna ýazmak
            await self.repo.sync_to_attendance_table(lesson_id, student_id, status)

        return QrSessionCloseResponse(
            session_id=session_id,
            present_count=present_count,
            absent_count=absent_count,
        )

    # ─── LIVE VIEW ───────────────────────────────────────────

    async def get_live_scans(
        self, session_id: int, current_user: dict
    ) -> list[QrLiveScanItem]:
        session = await self._get_session_or_404(session_id)
        await self._check_lesson_owner(session["lesson_id"], get_user_id(current_user))

        records = await self.repo.get_scanned_students(session_id)
        return [
            QrLiveScanItem(
                student_id=r["student_id"],
                student_name=r["student_name"],
                scanned_at=r["scanned_at"],
            )
            for r in records
        ]

    # ─── VERIFY SCANNED QR (STUDENT) ─────────────────────────

    async def verify_qr(
        self,
        request: QrVerifyRequest,
        current_user: dict,
        client_ip: str | None = None,
        user_agent: str | None = None,
    ) -> QrVerifyResponse:
        student_id = get_user_id(current_user)
        student_name = current_user.get("full_name", f"Student {student_id}")

        session_id = request.session_id
        submitted_token = request.token

        session = await self._get_session_or_404(session_id)

        # 1. Session status check
        if session["status"] != "active":
            raise QrSessionClosedError()

        # 2. Token match check
        if submitted_token != session["current_token"]:
            raise QrTokenInvalidError()

        # 3. Token expiry check
        now = datetime.now(timezone.utc)
        # Token_expires_at adaty datetime obýekti hökmünde gelip biler (DB-den)
        # Şonuň üçin timezone bilen deňeşdirilmegi üpjün etmek gerek
        expires_at = session["token_expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now > expires_at:
            raise QrTokenExpiredError()

        # 4. Enrollment check
        lesson_id = session["lesson_id"]
        is_enrolled = await self.repo.is_student_enrolled_in_lesson(
            lesson_id, student_id
        )
        if not is_enrolled:
            raise QrNotEnrolledError()

        # 5. Duplicate check
        has_scanned = await self.repo.has_student_scanned(session_id, student_id)
        if has_scanned:
            raise QrAlreadyScannedError()

        # Ýazga al we köne tablisa sync et
        device_hash = (
            compute_device_hash(user_agent, client_ip)
            if user_agent and client_ip
            else None
        )

        await self.repo.log_scan(
            session_id=session_id,
            student_id=student_id,
            scanned_token=submitted_token,
            device_hash=device_hash,
            ip_address=client_ip,
        )

        # Bu sapagyň öz wagtynda attendance logs-a sync edýäris (live data üçin).
        # Session closed bolanda ýene absent/present doly barlanýar.
        await self.repo.sync_to_attendance_table(lesson_id, student_id, "present")

        return QrVerifyResponse(
            status="present",
            student_name=student_name,
            message="Üstünlikli bellendi! ✅",
        )
