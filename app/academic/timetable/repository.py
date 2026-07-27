from aiomysql import DictCursor

from app.academic.timetable.schemas import TimetableCreate, TimetableUpdate
from app.core.base_repository import BaseRepository


class TimetableRepository(BaseRepository):
    def __init__(self, conn):
        super().__init__(conn)

    # ─── CREATE ─────────────────────────────────────────────

    async def create(self, data: TimetableCreate) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    INSERT INTO timetable
                        (assignment_id, day, start_time, end_time, room)
                    VALUES
                        (%s, %s, %s, %s, %s)
                """,
                (
                    data.assignment_id,
                    data.day,
                    data.start_time,
                    data.end_time,
                    data.room,
                ),
            )
            new_id = cur.lastrowid

        return await self.get_by_id_or_raise(new_id)

    # ─── GET ALL ─────────────────────────────────────────────

    async def get_all(self) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                    SELECT
                        t.id,
                        t.day,
                        TIME_FORMAT(t.start_time, '%%H:%%i:%%s') as start_time,
                        TIME_FORMAT(t.end_time, '%%H:%%i:%%s') as end_time,
                        t.room,
                        t.assignment_id,
                        sa.semester,
                        sa.user_id    AS teacher_id,
                        u.full_name   AS teacher_name,
                        sa.subject_id,
                        s.name        AS subject_name,
                        sa.section_id,
                        sec.number    AS section_number
                        FROM timetable t
                        JOIN subject_assignments sa ON sa.id=t.assignment_id
                        JOIN users               u  ON u.id=sa.user_id
                        JOIN subjects            s  ON s.id=sa.subject_id
                        JOIN sections            sec ON sec.id=sa.section_id
                        ORDER BY
                                FIELD(t.day,
                                "monday","tuesday","wednesday",
                                "thursday","friday","saturday"),
                                t.start_time;
                """)
            return await cur.fetchall()

    # ─── GET by ID ─────────────────────────────────────────────

    async def get_by_id(self, id: int) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT
                        t.id,
                        t.assignment_id,
                        t.day,
                        TIME_FORMAT(t.start_time, '%%H:%%i:%%s') as start_time,
                        TIME_FORMAT(t.end_time, '%%H:%%i:%%s') as end_time,
                        t.room,
                        sa.semester,
                        u.full_name   AS teacher_name,
                        s.name        AS subject_name,
                        sec.number    AS section_number
                        FROM timetable t
                        JOIN subject_assignments sa ON sa.id=t.assignment_id
                        JOIN users               u  ON u.id=sa.user_id
                        JOIN subjects            s  ON s.id=sa.subject_id
                        JOIN sections            sec ON sec.id=sa.section_id
                        WHERE t.id=%s
                """,
                (id,),
            )
            return await cur.fetchone()

    # ─── GET ALL GROUP WEEK  ─────────────────────────────────────────────

    async def get_all_group_week(self, section_id: int) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT
                        t.id,
                        t.day,
                        TIME_FORMAT(t.start_time, '%%H:%%i:%%s') as start_time,
                        TIME_FORMAT(t.end_time, '%%H:%%i:%%s') as end_time,
                        t.room,
                        t.assignment_id,
                        sa.semester,
                        u.full_name   AS teacher_name,
                        s.name        AS subject_name,
                        sec.number    AS section_number
                        FROM timetable t
                        JOIN subject_assignments sa ON sa.id=t.assignment_id
                        JOIN users               u  ON u.id=sa.user_id
                        JOIN subjects            s  ON s.id=sa.subject_id
                        JOIN sections            sec ON sec.id=sa.section_id
                                WHERE sa.section_id=%s
                        ORDER BY
                                FIELD(t.day,
                                "monday","tuesday","wednesday",
                                "thursday","friday","saturday"),
                                t.start_time
                """,
                (section_id,),
            )
            return await cur.fetchall()

    # ─── GET DAY GROUP   ─────────────────────────────────────────────

    async def get_day_group(self, section_id: int, day: str) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT
                        t.id,
                        t.day,
                        TIME_FORMAT(t.start_time, '%%H:%%i:%%s') as start_time,
                        TIME_FORMAT(t.end_time, '%%H:%%i:%%s') as end_time,
                        t.room,
                        t.assignment_id,
                        sa.semester,
                        u.full_name   AS teacher_name,
                        s.name        AS subject_name,
                        sec.number    AS section_number
                        FROM timetable t
                        JOIN subject_assignments sa ON sa.id=t.assignment_id
                        JOIN users               u  ON u.id=sa.user_id
                        JOIN subjects            s  ON s.id=sa.subject_id
                        JOIN sections            sec ON sec.id=sa.section_id
                                WHERE sa.section_id=%s AND t.day=%s
                        ORDER BY t.start_time
                """,
                (section_id, day),
            )
            return await cur.fetchall()

    # ─── GET BY TEACHER(WEEK)   ─────────────────────────────────────────────

    async def get_by_teacher(self, user_id: int) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT
                        t.id,
                        t.day,
                        TIME_FORMAT(t.start_time, '%%H:%%i:%%s') as start_time,
                        TIME_FORMAT(t.end_time, '%%H:%%i:%%s') as end_time,
                        t.room,
                        sa.semester,
                        u.full_name   AS teacher_name,
                        s.name        AS subject_name,
                        sec.number    AS section_number
                        FROM timetable t
                        JOIN subject_assignments sa ON sa.id=t.assignment_id
                        JOIN users               u  ON u.id=sa.user_id
                        JOIN subjects            s  ON s.id=sa.subject_id
                        JOIN sections            sec ON sec.id=sa.section_id
                                WHERE   sa.user_id=%s
                            ORDER BY
                                FIELD(t.day,
                                "monday","tuesday","wednesday",
                                "thursday","friday","saturday"),
                                t.start_time
                """,
                (user_id,),
            )
            return await cur.fetchall()

    # ─── GET BY TEACHER(DAY)   ─────────────────────────────────────────────

    async def get_by_teacher_day(self, user_id: int, day: str) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT
                        t.id,
                        t.day,
                        TIME_FORMAT(t.start_time, '%%H:%%i:%%s') as start_time,
                        TIME_FORMAT(t.end_time, '%%H:%%i:%%s') as end_time,
                        t.room,
                        sa.semester,
                        u.full_name   AS teacher_name,
                        s.name        AS subject_name,
                        sec.number    AS section_number
                        FROM timetable t
                        JOIN subject_assignments sa ON sa.id=t.assignment_id
                        JOIN users               u  ON u.id=sa.user_id
                        JOIN subjects            s  ON s.id=sa.subject_id
                        JOIN sections            sec ON sec.id=sa.section_id
                                WHERE   sa.user_id=%s  AND t.day=%s
                                ORDER BY t.start_time
                """,
                (user_id, day),
            )
            return await cur.fetchall()

    # ─── UPDATE ──────────────────────────────────────────────

    async def update(self, id: int, data: TimetableUpdate) -> dict:
        fields = []
        values = []

        if data.assignment_id is not None:
            fields.append("assignment_id=%s")
            values.append(data.assignment_id)
        if data.day is not None:
            fields.append("day = %s")
            values.append(data.day.value)
        if data.start_time is not None:
            fields.append("start_time =%s")
            values.append(data.start_time)
        if data.end_time is not None:
            fields.append("end_time= %s")
            values.append(data.end_time)
        if data.room is not None:
            fields.append("room= %s")
            values.append(data.room)

        if not fields:
            return await self.get_by_id_or_raise(id)

        values.append(id)

        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                f"""
                    UPDATE timetable
                    SET {", ".join(fields)}
                    WHERE id = %s
                """,
                tuple(values),
            )

        return await self.get_by_id_or_raise(id)

    # ─── DELETE ──────────────────────────────────────────────

    async def delete(self, id: int) -> bool:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    DELETE FROM timetable
                    WHERE id = %s
                """,
                (id,),
            )
            return cur.rowcount > 0

    # ─── CONFLICT BARLAG (Teacher) ───────────────────────────

    async def teacher_conflict(
        self, user_id: int, day: str, start_time: str, exclude_id: int | None
    ) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            query = """
                    SELECT
                        t.id,
                        t.day,
                        TIME_FORMAT(t.start_time, '%%H:%%i:%%s') as start_time,
                        s.name AS subject_name,
                        sec.number AS section_number
                    FROM timetable t
                    JOIN subject_assignments sa
                        ON sa.id = t.assignment_id
                    JOIN subjects s ON s.id = sa.subject_id
                    JOIN sections sec ON sec.id = sa.section_id
                    WHERE sa.user_id = %s
                    AND t.day = %s
                    AND t.start_time = %s
                """
            params = [user_id, day, start_time]

            if exclude_id is not None:
                query += " AND t.id != %s"
                params.append(exclude_id)

            await cur.execute(query, params)
            return await cur.fetchone()

    async def exists(
        self, assignment_id: int, day: str, start_time: str, exclude_id: int | None
    ) -> bool:
        async with self.conn.cursor(DictCursor) as cur:
            query = """
                    SELECT id FROM timetable
                    WHERE assignment_id = %s
                    AND day = %s
                    AND start_time = %s
                """
            params = [assignment_id, day, start_time]

            if exclude_id is not None:
                query += " AND id != %s"
                params.append(exclude_id)

            await cur.execute(query, params)
            return await cur.fetchone() is not None
