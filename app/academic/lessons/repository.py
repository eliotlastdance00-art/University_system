
from datetime import date
from aiomysql import DictCursor


class LessonRepository:
    def __init__(self, conn):
        self.conn = conn

    # ─── CREATE (Sapak başlat) ───────────────────────────────

    async def create(
        self,
        timetable_id: int,
        date: date,
    ) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    INSERT INTO lessons
                        (timetable_id, date, status)
                    VALUES
                        (%s, %s, 'completed')
                """, (timetable_id, date))
                await self.conn.commit()
                return await self.get_by_id(cur.lastrowid)


    # ─── GET BY ID ───────────────────────────────────────────

    async def get_by_id(self, id: int) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        l.id,
                        l.timetable_id,
                        l.date,
                        l.status,
                        l.note,
                        s.name AS subject_name,
                        sec.number AS section_number,
                        u.full_name AS teacher_name
                    FROM lessons l
                    JOIN timetable t
                        ON t.id = l.timetable_id
                    JOIN subject_assignments sa
                        ON sa.id = t.assignment_id
                    JOIN subjects s ON s.id = sa.subject_id
                    JOIN sections sec ON sec.id = sa.section_id
                    JOIN users u ON u.id = sa.user_id
                    WHERE l.id = %s
                """, (id,))
                return await cur.fetchone()


    # ─── GET ALL (Admin) ─────────────────────────────────────

    async def get_all(self) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        l.id,
                        l.timetable_id,
                        l.date,
                        l.status,
                        l.note,
                        s.name AS subject_name,
                        sec.number AS section_number,
                        u.full_name AS teacher_name
                    FROM lessons l
                    JOIN timetable t
                        ON t.id = l.timetable_id
                    JOIN subject_assignments sa
                        ON sa.id = t.assignment_id
                    JOIN subjects s ON s.id = sa.subject_id
                    JOIN sections sec ON sec.id = sa.section_id
                    JOIN users u ON u.id = sa.user_id
                    ORDER BY l.date DESC
                """)
                return await cur.fetchall()


    # ─── GET BY DATE (Admin) ─────────────────────────────────

    async def get_by_date(self, date: date) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        l.id,
                        l.timetable_id,
                        l.date,
                        l.status,
                        l.note,
                        s.name AS subject_name,
                        sec.number AS section_number,
                        u.full_name AS teacher_name
                    FROM lessons l
                    JOIN timetable t
                        ON t.id = l.timetable_id
                    JOIN subject_assignments sa
                        ON sa.id = t.assignment_id
                    JOIN subjects s ON s.id = sa.subject_id
                    JOIN sections sec ON sec.id = sa.section_id
                    JOIN users u ON u.id = sa.user_id
                    WHERE l.date = %s
                    ORDER BY t.start_time
                """, (date,))
                return await cur.fetchall()


    # ─── GET BY TIMETABLE ────────────────────────────────────

    async def get_by_timetable(
        self,
        timetable_id: int
    ) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        l.id,
                        l.timetable_id,
                        l.date,
                        l.status,
                        l.note,
                        s.name AS subject_name,
                        sec.number AS section_number,
                        u.full_name AS teacher_name
                    FROM lessons l
                    JOIN timetable t
                        ON t.id = l.timetable_id
                    JOIN subject_assignments sa
                        ON sa.id = t.assignment_id
                    JOIN subjects s ON s.id = sa.subject_id
                    JOIN sections sec ON sec.id = sa.section_id
                    JOIN users u ON u.id = sa.user_id
                    WHERE l.timetable_id = %s
                    ORDER BY l.date DESC
                """, (timetable_id,))
                return await cur.fetchall()


    # ─── GET MY HISTORY (Teacher) ────────────────────────────

    async def get_my_history(
        self,
        user_id: int
    ) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        l.id,
                        l.timetable_id,
                        l.date,
                        l.status,
                        l.note,
                        s.name AS subject_name,
                        sec.number AS section_number,
                        u.full_name AS teacher_name
                    FROM lessons l
                    JOIN timetable t
                        ON t.id = l.timetable_id
                    JOIN subject_assignments sa
                        ON sa.id = t.assignment_id
                    JOIN subjects s ON s.id = sa.subject_id
                    JOIN sections sec ON sec.id = sa.section_id
                    JOIN users u ON u.id = sa.user_id
                    WHERE sa.user_id = %s
                    ORDER BY l.date DESC
                """, (user_id,))
                return await cur.fetchall()


    # ─── GET MY STATS (Teacher) ──────────────────────────────

    async def get_my_stats(
        self,
        user_id: int
    ) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        COUNT(*) AS total,
                        SUM(l.status = 'completed') AS completed,
                        SUM(l.status = 'cancelled') AS cancelled
                    FROM lessons l
                    JOIN timetable t
                        ON t.id = l.timetable_id
                    JOIN subject_assignments sa
                        ON sa.id = t.assignment_id
                    WHERE sa.user_id = %s
                """, (user_id,))
                return await cur.fetchone()


    # ─── CANCEL ──────────────────────────────────────────────

    async def cancel(
        self,
        id: int,
        note: str | None
    ) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    UPDATE lessons
                    SET status = 'cancelled',
                        note = %s
                    WHERE id = %s
                """, (note, id))
                await self.conn.commit()
                return await self.get_by_id(id)


    # ─── DUPLICATE BARLAG ────────────────────────────────────

    async def exists(
        self,
        timetable_id: int,
        date: date
    ) -> bool:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT id FROM lessons
                    WHERE timetable_id = %s
                    AND date = %s
                """, (timetable_id, date))
                return await cur.fetchone() is not None


    # ─── MUGALLYMYŇMY BARLAG ─────────────────────────────────

    async def is_owner(
        self,
        lesson_id: int,
        user_id: int
    ) -> bool:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT l.id
                    FROM lessons l
                    JOIN timetable t
                        ON t.id = l.timetable_id
                    JOIN subject_assignments sa
                        ON sa.id = t.assignment_id
                    WHERE l.id = %s
                    AND sa.user_id = %s
                """, (lesson_id, user_id))
                return await cur.fetchone() is not None