"""
QR Attendance Repository — database sorgulary.

Ähli SQL sorgulary şu ýerde ýerleşýär.
Service layer bu repository-ny ulanýar.
"""

from datetime import datetime, timezone

from aiomysql import DictCursor


class QrSessionRepository:
    def __init__(self, conn):
        self.conn = conn

    # ─── SESSION ─────────────────────────────────────────────

    async def get_active_session_by_lesson(self, lesson_id: int) -> dict | None:
        """Lesson üçin açyk (active) session-y tapýar."""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                SELECT id, lesson_id, teacher_id, status,
                       current_token, token_expires_at,
                       created_at, closed_at
                FROM qr_sessions
                WHERE lesson_id = %s AND status = 'active'
                LIMIT 1
            """, (lesson_id,))
            return await cur.fetchone()

    async def get_session_by_id(self, session_id: int) -> dict | None:
        """Session-y ID boýunça tapýar."""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                SELECT id, lesson_id, teacher_id, status,
                       current_token, token_expires_at,
                       created_at, closed_at
                FROM qr_sessions
                WHERE id = %s
            """, (session_id,))
            return await cur.fetchone()

    async def create_session(
        self,
        lesson_id: int,
        teacher_id: int,
        token: str,
        token_expires_at: datetime,
    ) -> int:
        """Täze QR session döredýär. Döredilen session-yň ID-sini gaýtarýar."""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                INSERT INTO qr_sessions
                    (lesson_id, teacher_id, current_token, token_expires_at)
                VALUES (%s, %s, %s, %s)
            """, (lesson_id, teacher_id, token, token_expires_at))
            await self.conn.commit()
            return cur.lastrowid

    async def update_token(
        self,
        session_id: int,
        new_token: str,
        new_expires_at: datetime,
    ) -> None:
        """Session-yň token-ini täzeleýär (rotasiýa)."""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                UPDATE qr_sessions
                SET current_token = %s, token_expires_at = %s
                WHERE id = %s AND status = 'active'
            """, (new_token, new_expires_at, session_id))
            await self.conn.commit()

    async def close_session(self, session_id: int) -> None:
        """Session-y ýapýar."""
        now = datetime.now(timezone.utc)
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                UPDATE qr_sessions
                SET status = 'closed', closed_at = %s
                WHERE id = %s
            """, (now, session_id))
            await self.conn.commit()

    # ─── ATTENDANCE LOG ──────────────────────────────────────

    async def log_scan(
        self,
        session_id: int,
        student_id: int,
        scanned_token: str,
        device_hash: str | None,
        ip_address: str | None,
    ) -> int:
        """Student-iň scan ýazgysyny saklaýar. Döredilen log ID gaýtarýar."""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                INSERT INTO qr_attendance_logs
                    (session_id, student_id, scanned_token, device_hash, ip_address)
                VALUES (%s, %s, %s, %s, %s)
            """, (session_id, student_id, scanned_token, device_hash, ip_address))
            await self.conn.commit()
            return cur.lastrowid

    async def has_student_scanned(self, session_id: int, student_id: int) -> bool:
        """Student bu session-da öň scan edipmi?"""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                SELECT 1
                FROM qr_attendance_logs
                WHERE session_id = %s AND student_id = %s
                LIMIT 1
            """, (session_id, student_id))
            return await cur.fetchone() is not None

    async def get_scanned_students(self, session_id: int) -> list[dict]:
        """Session-da scan eden studentleriň sanawyny gaýtarýar (live view)."""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                SELECT
                    ql.student_id,
                    u.full_name AS student_name,
                    ql.scanned_at
                FROM qr_attendance_logs ql
                JOIN users u ON u.id = ql.student_id
                WHERE ql.session_id = %s
                ORDER BY ql.scanned_at ASC
            """, (session_id,))
            return await cur.fetchall()

    async def get_present_count(self, session_id: int) -> int:
        """Session-da scan eden studentleriň sanyny gaýtarýar."""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                SELECT COUNT(*) AS cnt
                FROM qr_attendance_logs
                WHERE session_id = %s
            """, (session_id,))
            row = await cur.fetchone()
            return row["cnt"] if row else 0

    # ─── ENROLLMENT CHECK ────────────────────────────────────

    async def is_student_enrolled_in_lesson(
        self, lesson_id: int, student_id: int
    ) -> bool:
        """Student şol lesson-yň section-yna degişlimi barlaýar.

        lessons → timetable → subject_assignments → sections → user_roles
        """
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                SELECT 1
                FROM lessons l
                JOIN timetable t        ON t.id = l.timetable_id
                JOIN subject_assignments sa ON sa.id = t.assignment_id
                JOIN sections sec       ON sec.id = sa.section_id
                JOIN user_roles ur      ON ur.role_id = 3
                WHERE l.id = %s
                  AND ur.user_id = %s
                LIMIT 1
            """, (lesson_id, student_id))
            return await cur.fetchone() is not None

    # ─── LESSON OWNERSHIP ───────────────────────────────────

    async def is_lesson_owner(self, lesson_id: int, teacher_id: int) -> bool:
        """Mugallym şol lesson-yň eýesimi?"""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                SELECT 1
                FROM lessons l
                JOIN timetable t        ON t.id = l.timetable_id
                JOIN subject_assignments sa ON sa.id = t.assignment_id
                WHERE l.id = %s AND sa.user_id = %s
                LIMIT 1
            """, (lesson_id, teacher_id))
            return await cur.fetchone() is not None

    # ─── KÖNE ATTENDANCE TABLISASYNA ÝAZMAK ──────────────────

    async def sync_to_attendance_table(
        self, lesson_id: int, student_id: int, status: str
    ) -> None:
        """QR netijelerini köne `attendance` tablisasyna-da ýazýar (backward compat).

        ON DUPLICATE KEY UPDATE — eger eýýäm bar bolsa status-y täzeleýär.
        """
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                INSERT INTO attendance (lesson_id, user_id, status)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE status = VALUES(status)
            """, (lesson_id, student_id, status))
            await self.conn.commit()

    # ─── SESSION CLOSE: Absent studentleri tapýar ────────────

    async def get_all_lesson_students(self, lesson_id: int) -> list[dict]:
        """Lesson-yň section-yndaky ähli studentleri gaýtarýar."""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                SELECT u.id AS student_id, u.full_name AS student_name
                FROM lessons l
                JOIN timetable t        ON t.id = l.timetable_id
                JOIN subject_assignments sa ON sa.id = t.assignment_id
                JOIN sections sec       ON sec.id = sa.section_id
                JOIN user_roles ur      ON ur.role_id = 3
                JOIN users u            ON u.id = ur.user_id
                WHERE l.id = %s
                ORDER BY u.full_name
            """, (lesson_id,))
            return await cur.fetchall()
