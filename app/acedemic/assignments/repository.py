from app.core.database import get_db
from .scheamas import (
    AssignmentCreate,
    AssignmentUpdate
)


class AssignmentRepository:

    # ─── CREATE ─────────────────────────────────────────────

    async def create(self, data: AssignmentCreate) -> dict:
        async with get_db() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO subject_assignments
                        (user_id, subject_id, group_id, semester)
                    VALUES
                        (%s, %s, %s, %s)
                """, (
                    data.user_id,
                    data.subject_id,
                    data.group_id,
                    data.semester.value
                ))
                await conn.commit()
                return await self.get_by_id(cur.lastrowid)


    # ─── GET ALL ─────────────────────────────────────────────

    async def get_all(self) -> list[dict]:
        async with get_db() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT
                        sa.id,
                        sa.semester,
                        sa.user_id    AS teacher_id,
                        u.full_name   AS teacher_name,
                        sa.subject_id,
                        s.name        AS subject_name,
                        sa.group_id,
                        g.name        AS group_name
                    FROM subject_assignments sa
                    JOIN users     u ON u.id = sa.user_id
                    JOIN subjects  s ON s.id = sa.subject_id
                    JOIN student_group g ON g.id = sa.group_id
                """)
                return await cur.fetchall()


    # ─── GET BY ID ───────────────────────────────────────────

    async def get_by_id(self, id: int) -> dict | None:
        async with get_db() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT
                        sa.id,
                        sa.semester,
                        sa.user_id    AS teacher_id,
                        u.full_name   AS teacher_name,
                        sa.subject_id,
                        s.name        AS subject_name,
                        sa.group_id,
                        g.name        AS group_name
                    FROM subject_assignments sa
                    JOIN users     u ON u.id = sa.user_id
                    JOIN subjects  s ON s.id = sa.subject_id
                    JOIN student_group g ON g.id = sa.group_id
                    WHERE sa.id = %s
                """, (id,))
                return await cur.fetchone()


    # ─── GET BY SEMESTER ─────────────────────────────────────

    async def get_by_semester(self, semester: str) -> list[dict]:
        async with get_db() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT
                        sa.id,
                        sa.semester,
                        sa.user_id    AS teacher_id,
                        u.full_name   AS teacher_name,
                        sa.subject_id,
                        s.name        AS subject_name,
                        sa.group_id,
                        g.name        AS group_name
                    FROM subject_assignments sa
                    JOIN users     u ON u.id = sa.user_id
                    JOIN subjects  s ON s.id = sa.subject_id
                    JOIN student_group g ON g.id = sa.group_id
                    WHERE sa.semester = %s
                """, (semester,))
                return await cur.fetchall()


    # ─── GET BY GROUP ─────────────────────────────────────────

    async def get_by_group(self, group_id: int) -> list[dict]:
        async with get_db() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT
                        sa.id,
                        sa.semester,
                        sa.user_id    AS teacher_id,
                        u.full_name   AS teacher_name,
                        sa.subject_id,
                        s.name        AS subject_name,
                        sa.group_id,
                        g.name        AS group_name
                    FROM subject_assignments sa
                    JOIN users     u ON u.id = sa.user_id
                    JOIN subjects  s ON s.id = sa.subject_id
                    JOIN student_group g ON g.id = sa.group_id
                    WHERE sa.group_id = %s
                """, (group_id,))
                return await cur.fetchall()


    # ─── GET BY TEACHER ───────────────────────────────────────

    async def get_by_teacher(self, user_id: int) -> list[dict]:
        async with get_db() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT
                        sa.id,
                        sa.semester,
                        sa.user_id    AS teacher_id,
                        u.full_name   AS teacher_name,
                        sa.subject_id,
                        s.name        AS subject_name,
                        sa.group_id,
                        g.name        AS group_name
                    FROM subject_assignments sa
                    JOIN users     u ON u.id = sa.user_id
                    JOIN subjects  s ON s.id = sa.subject_id
                    JOIN student_group g ON g.id = sa.group_id
                    WHERE sa.user_id = %s
                """, (user_id,))
                return await cur.fetchall()


    # ─── GET BY TEACHER + SEMESTER ────────────────────────────

    async def get_by_teacher_semester(
        self,
        user_id: int,
        semester: str
    ) -> list[dict]:
        async with get_db() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT
                        sa.id,
                        sa.semester,
                        sa.user_id    AS teacher_id,
                        u.full_name   AS teacher_name,
                        sa.subject_id,
                        s.name        AS subject_name,
                        sa.group_id,
                        g.name        AS group_name
                    FROM subject_assignments sa
                    JOIN users     u ON u.id = sa.user_id
                    JOIN subjects  s ON s.id = sa.subject_id
                    JOIN student_group g ON g.id = sa.group_id
                    WHERE sa.user_id  = %s
                      AND sa.semester = %s
                """, (user_id, semester))
                return await cur.fetchall()


    # ─── GET TEACHER SCHEDULE (Timetable bilen) ───────────────

    async def get_teacher_schedule(self, user_id: int) -> list[dict]:
        async with get_db() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT
                        sa.id          AS assignment_id,
                        s.name         AS subject_name,
                        g.name         AS group_name,
                        sa.semester,
                        t.id           AS timetable_id,
                        t.day,
                        t.start_time,
                        t.end_time,
                        t.room
                    FROM subject_assignments sa
                    JOIN users         u ON u.id = sa.user_id
                    JOIN subjects      s ON s.id = sa.subject_id
                    JOIN student_group g ON g.id = sa.group_id
                    LEFT JOIN timetable t ON t.assignment_id = sa.id
                    WHERE sa.user_id = %s
                    ORDER BY
                        FIELD(t.day,
                            'monday','tuesday','wednesday',
                            'thursday','friday','saturday'),
                        t.start_time
                """, (user_id,))
                return await cur.fetchall()


    # ─── UPDATE ──────────────────────────────────────────────

    async def update(
        self,
        id: int,
        data: AssignmentUpdate
    ) -> dict | None:
        fields = []
        values = []

        if data.user_id is not None:
            fields.append("user_id = %s")
            values.append(data.user_id)
        if data.subject_id is not None:
            fields.append("subject_id = %s")
            values.append(data.subject_id)
        if data.group_id is not None:
            fields.append("group_id = %s")
            values.append(data.group_id)
        if data.semester is not None:
            fields.append("semester = %s")
            values.append(data.semester.value)

        if not fields:
            return await self.get_by_id(id)

        values.append(id)

        async with get_db() as conn:
            async with conn.cursor() as cur:
                await cur.execute(f"""
                    UPDATE subject_assignments
                    SET {', '.join(fields)}
                    WHERE id = %s
                """, values)
                await conn.commit()
                return await self.get_by_id(id)


    # ─── DELETE ──────────────────────────────────────────────

    async def delete(self, id: int) -> bool:
        async with get_db() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    DELETE FROM subject_assignments
                    WHERE id = %s
                """, (id,))
                await conn.commit()
                return cur.rowcount > 0


    # ─── DUPLICATE BARLAG ────────────────────────────────────

    async def exists(
        self,
        user_id: int,
        subject_id: int,
        group_id: int,
        semester: str,
        exclude_id: int = None
    ) -> bool:
        async with get_db() as conn:
            async with conn.cursor() as cur:
                query = """
                    SELECT id FROM subject_assignments
                    WHERE user_id    = %s
                      AND subject_id = %s
                      AND group_id   = %s
                      AND semester   = %s
                """
                params = [user_id, subject_id, group_id, semester]

                if exclude_id:
                    query += " AND id != %s"
                    params.append(exclude_id)

                await cur.execute(query, params)
                return await cur.fetchone() is not None