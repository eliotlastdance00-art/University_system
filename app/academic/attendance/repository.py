
from aiomysql import DictCursor


class AttendanceRepository:
    def __init__(self, conn):
        self.conn = conn

    # ─── GET STUDENTS BY GROUP ───────────────────────────────
    # Lesson başlanda şol toparyň
    # studentlerini getir

    async def get_students_by_lesson(
        self,
        lesson_id: int
    ) -> list[dict]:
       async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        u.id AS student_id,
                        u.full_name AS student_name,
                        COALESCE(a.status, 'absent') AS status,
                        a.id AS attendance_id
                    FROM lessons l
                    JOIN timetable t
                         ON t.id = l.timetable_id
                    JOIN subject_assignments sa
                         ON sa.id = t.assignment_id
                    JOIN student_group sg
                         ON sg.id = sa.group_id
                    JOIN user_roles ur
                         ON ur.role_id = 3
                    JOIN users u
                         ON u.id = ur.user_id
                    LEFT JOIN attendance a
                         ON a.lesson_id = l.id
                         AND a.student_id = u.id
                    WHERE l.id = %s
                    ORDER BY u.full_name
                """, (lesson_id,))
                return await cur.fetchall()


    # ─── BULK CREATE ─────────────────────────────────────────

    async def bulk_create(
        self,
        lesson_id: int,
        records: list[dict]
    ) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.executemany("""
                    INSERT INTO attendance
                        (lesson_id, student_id, status)
                    VALUES
                        (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        status = VALUES(status)
                """, [
                    (lesson_id, r["student_id"], r["status"])
                    for r in records
                ])
                await self.conn.commit()
                return await self.get_by_lesson(lesson_id)


    # ─── GET BY LESSON ───────────────────────────────────────

    async def get_by_lesson(
        self,
        lesson_id: int
    ) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        a.id,
                        a.lesson_id,
                        a.user_id ,
                        u.full_name AS student_name,
                        a.status
                    FROM attendance a
                    JOIN users u ON u.id = a.user_id
                    WHERE a.lesson_id = %s
                    ORDER BY u.full_name
                """, (lesson_id,))
                return await cur.fetchall()


    # ─── GET BY LESSON STATS ─────────────────────────────────

    async def get_lesson_stats(
        self,
        lesson_id: int
    ) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        COUNT(*) AS total,
                        SUM(a.status = 'present') AS present,
                        SUM(a.status = 'absent') AS absent,
                        ROUND(
                            SUM(a.status = 'present') * 100.0
                            / COUNT(*), 1
                        ) AS percentage
                    FROM attendance a
                    WHERE a.lesson_id = %s
                """, (lesson_id,))
                return await cur.fetchone()


    # ─── GET BY STUDENT ──────────────────────────────────────

    async def get_by_student(
        self,
        student_id: int
    ) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        a.id,
                        a.lesson_id,
                        a.user_id,
                        u.full_name AS student_name,
                        a.status,
                        l.date,
                        s.name AS subject_name,
                        g.name AS group_name
                    FROM attendance a
                    JOIN users u
                         ON u.id = a.user_id
                    JOIN lessons l
                         ON l.id = a.lesson_id
                    JOIN timetable t
                         ON t.id = l.timetable_id
                    JOIN subject_assignments sa
                         ON sa.id = t.assignment_id
                    JOIN subjects s ON s.id = sa.subject_id
                    JOIN student_group g ON g.id = sa.group_id
                    WHERE a.user_id = %s
                    ORDER BY l.date DESC
                """, (student_id,))
                return await cur.fetchall()


    # ─── GET STUDENT STATS ───────────────────────────────────

    async def get_student_stats(
        self,
        student_id: int
    ) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        COUNT(*) AS total,
                        SUM(a.status = 'present') AS present,
                        SUM(a.status = 'absent') AS absent,
                        ROUND(
                            SUM(a.status = 'present') * 100.0
                            / COUNT(*), 1
                        ) AS percentage
                    FROM attendance a
                    WHERE a.user_id = %s
                """, (student_id,))
                return await cur.fetchone()


    # ─── GET GROUP STATS ─────────────────────────────────────

    async def get_group_stats(
        self,
        group_id: int
    ) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    SELECT
                        u.id AS student_id,
                        u.full_name AS student_name,
                        COUNT(*) AS total,
                        SUM(a.status = 'present') AS present,
                        SUM(a.status = 'absent') AS absent,
                        ROUND(
                            SUM(a.status = 'present') * 100.0
                            / COUNT(*), 1
                        ) AS percentage
                    FROM attendance a
                    JOIN users u ON u.id = a.user_id
                    JOIN lessons l ON l.id = a.lesson_id
                    JOIN timetable t ON t.id = l.timetable_id
                    JOIN subject_assignments sa
                         ON sa.id = t.assignment_id
                    WHERE sa.group_id = %s
                    GROUP BY u.id, u.full_name
                    ORDER BY percentage ASC
                """, (group_id,))
                return await cur.fetchall()


    # ─── UPDATE ──────────────────────────────────────────────

    async def update(
        self,
        id: int,
        status: str
    ) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
                await cur.execute("""
                    UPDATE attendance
                    SET status = %s
                    WHERE id = %s
                """, (status, id))
                await self.conn.commit()
                await cur.execute("""
                    SELECT
                        a.id,
                        a.lesson_id,
                        a.user_id,
                        u.full_name AS student_name,
                        a.status
                    FROM attendance a
                    JOIN users u ON u.id = a.user_id
                    WHERE a.id = %s
                """, (id,))
                return await cur.fetchone()


    # ─── IS OWNER (Mugallymyňmy?) ────────────────────────────

    async def is_lesson_owner(
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