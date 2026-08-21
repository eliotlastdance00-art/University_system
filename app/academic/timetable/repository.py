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
                        (assignment_id, day, start_time, end_time, room, room_id)
                    VALUES
                        (%s, %s, %s, %s, %s, %s)
                """,
                (
                    data.assignment_id,
                    data.day,
                    data.start_time,
                    data.end_time,
                    data.room,
                    getattr(data, "room_id", None),
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
                        t.room_id,
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
                        t.room_id,
                        sa.semester,
                        sa.user_id    AS teacher_id,
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
                        t.room_id,
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
                        t.room_id,
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
                        t.room_id,
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
                        t.room_id,
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
        if data.room_id is not None:
            fields.append("room_id= %s")
            values.append(data.room_id)

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

    # ═══════════════════════════════════════════════════════════
    # GENERATION TASKS
    # ═══════════════════════════════════════════════════════════

    async def create_task(self, created_by: int, parameters: dict) -> dict:
        import json
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    INSERT INTO timetable_generation_tasks
                        (status, parameters, created_by)
                    VALUES
                        ('PENDING', %s, %s)
                """,
                (json.dumps(parameters), created_by)
            )
            task_id = cur.lastrowid

        task = await self.get_task(task_id)
        if not task:
            raise RuntimeError("Task could not be fetched after creation")
        return task

    async def get_task(self, task_id: int) -> dict | None:
        import json
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT id, status, parameters, error_message, created_by, created_at, completed_at
                    FROM timetable_generation_tasks
                    WHERE id = %s
                """,
                (task_id,)
            )
            row = await cur.fetchone()
            if row and isinstance(row.get("parameters"), str):
                try:
                    row["parameters"] = json.loads(row["parameters"])
                except Exception:
                    row["parameters"] = {}
            return row

    async def get_all_tasks(self) -> list[dict]:
        import json
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT id, status, parameters, error_message, created_by, created_at, completed_at
                    FROM timetable_generation_tasks
                    ORDER BY created_at DESC
                """
            )
            rows = await cur.fetchall()
            for row in rows:
                if isinstance(row.get("parameters"), str):
                    try:
                        row["parameters"] = json.loads(row["parameters"])
                    except Exception:
                        row["parameters"] = {}
            return rows

    async def update_task_status(self, task_id: int, status: str, error_message: str | None = None) -> None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    UPDATE timetable_generation_tasks
                    SET status = %s, error_message = %s,
                        completed_at = IF(%s IN ('COMPLETED', 'FAILED'), CURRENT_TIMESTAMP, completed_at)
                    WHERE id = %s
                """,
                (status, error_message, status, task_id)
            )

    async def delete_task(self, task_id: int) -> None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    DELETE FROM timetable_generation_tasks
                    WHERE id = %s
                """,
                (task_id,)
            )

    # ═══════════════════════════════════════════════════════════
    # DRAFTS
    # ═══════════════════════════════════════════════════════════

    async def create_draft(
        self, task_id: int, assignment_id: int, day: str,
        start_time: str, end_time: str, room: str, room_id: int | None = None
    ) -> None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    INSERT INTO timetable_drafts
                        (task_id, assignment_id, day, start_time, end_time, room, room_id)
                    VALUES
                        (%s, %s, %s, %s, %s, %s, %s)
                """,
                (task_id, assignment_id, day, start_time, end_time, room, room_id)
            )

    async def get_drafts_by_task(self, task_id: int) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT
                        d.id,
                        d.task_id,
                        d.day,
                        TIME_FORMAT(d.start_time, '%%H:%%i:%%s') as start_time,
                        TIME_FORMAT(d.end_time, '%%H:%%i:%%s') as end_time,
                        d.room,
                        d.room_id,
                        d.assignment_id,
                        sa.semester,
                        sa.user_id    AS teacher_id,
                        u.full_name   AS teacher_name,
                        sa.subject_id,
                        s.name        AS subject_name,
                        sa.section_id,
                        sec.number    AS section_number
                    FROM timetable_drafts d
                    JOIN subject_assignments sa ON sa.id=d.assignment_id
                    JOIN users               u  ON u.id=sa.user_id
                    JOIN subjects            s  ON s.id=sa.subject_id
                    JOIN sections            sec ON sec.id=sa.section_id
                    WHERE d.task_id = %s
                    ORDER BY
                            FIELD(d.day,
                            "monday","tuesday","wednesday",
                            "thursday","friday","saturday"),
                            d.start_time;
                """,
                (task_id,)
            )
            return await cur.fetchall()

    async def delete_drafts_by_task(self, task_id: int) -> None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    DELETE FROM timetable_drafts
                    WHERE task_id = %s
                """,
                (task_id,)
            )

    # ═══════════════════════════════════════════════════════════
    # ROOMS — CRUD
    # ═══════════════════════════════════════════════════════════

    async def get_all_rooms(self, active_only: bool = False) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            query = "SELECT * FROM rooms"
            if active_only:
                query += " WHERE is_active = TRUE"
            query += " ORDER BY name"
            await cur.execute(query)
            return await cur.fetchall()

    async def get_room_by_id(self, room_id: int) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("SELECT * FROM rooms WHERE id = %s", (room_id,))
            return await cur.fetchone()

    async def create_room(self, name: str, capacity: int, room_type: str,
                          building: str | None, floor: int | None, is_active: bool) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    INSERT INTO rooms (name, capacity, room_type, building, floor, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (name, capacity, room_type, building, floor, is_active)
            )
            room_id = cur.lastrowid
        return await self.get_room_by_id(room_id)

    async def update_room(self, room_id: int, **kwargs) -> dict | None:
        fields = []
        values = []
        for key, val in kwargs.items():
            if val is not None:
                fields.append(f"{key} = %s")
                values.append(val)
        if not fields:
            return await self.get_room_by_id(room_id)
        values.append(room_id)
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                f"UPDATE rooms SET {', '.join(fields)} WHERE id = %s",
                tuple(values)
            )
        return await self.get_room_by_id(room_id)

    async def delete_room(self, room_id: int) -> bool:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("DELETE FROM rooms WHERE id = %s", (room_id,))
            return cur.rowcount > 0

    # ═══════════════════════════════════════════════════════════
    # TIME SLOTS
    # ═══════════════════════════════════════════════════════════

    async def get_all_time_slots(self) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT id, slot_number, label,
                           TIME_FORMAT(start_time, '%%H:%%i:%%s') as start_time,
                           TIME_FORMAT(end_time, '%%H:%%i:%%s') as end_time
                    FROM time_slots
                    ORDER BY slot_number
                """
            )
            return await cur.fetchall()

    # ═══════════════════════════════════════════════════════════
    # TEACHER AVAILABILITIES
    # ═══════════════════════════════════════════════════════════

    async def get_teacher_availabilities(self, user_id: int) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT ta.id, ta.user_id, ta.day, ta.slot_number,
                           ts.label, TIME_FORMAT(ts.start_time, '%%H:%%i:%%s') as start_time,
                           TIME_FORMAT(ts.end_time, '%%H:%%i:%%s') as end_time
                    FROM teacher_availabilities ta
                    JOIN time_slots ts ON ts.slot_number = ta.slot_number
                    WHERE ta.user_id = %s
                    ORDER BY FIELD(ta.day, 'monday','tuesday','wednesday','thursday','friday','saturday'),
                             ta.slot_number
                """,
                (user_id,)
            )
            return await cur.fetchall()

    async def get_all_teacher_availabilities(self) -> list[dict]:
        """Get all availabilities for all teachers — used by generator."""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    SELECT ta.user_id, ta.day, ta.slot_number
                    FROM teacher_availabilities ta
                """
            )
            return await cur.fetchall()

    async def set_teacher_availability(self, user_id: int, day: str, slot_number: int) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                    INSERT IGNORE INTO teacher_availabilities (user_id, day, slot_number)
                    VALUES (%s, %s, %s)
                """,
                (user_id, day, slot_number)
            )
            await cur.execute(
                "SELECT * FROM teacher_availabilities WHERE user_id=%s AND day=%s AND slot_number=%s",
                (user_id, day, slot_number)
            )
            return await cur.fetchone()

    async def delete_teacher_availability(self, user_id: int, day: str | None = None) -> int:
        async with self.conn.cursor(DictCursor) as cur:
            if day:
                await cur.execute(
                    "DELETE FROM teacher_availabilities WHERE user_id=%s AND day=%s",
                    (user_id, day)
                )
            else:
                await cur.execute(
                    "DELETE FROM teacher_availabilities WHERE user_id=%s",
                    (user_id,)
                )
            return cur.rowcount

    async def bulk_set_teacher_availability(self, user_id: int, entries: list[dict]) -> int:
        """Replace all availability for a teacher with new entries."""
        async with self.conn.cursor(DictCursor) as cur:
            # Clear existing
            await cur.execute("DELETE FROM teacher_availabilities WHERE user_id=%s", (user_id,))
            # Insert new
            if entries:
                values = [(user_id, e["day"], e["slot_number"]) for e in entries]
                await cur.executemany(
                    "INSERT INTO teacher_availabilities (user_id, day, slot_number) VALUES (%s, %s, %s)",
                    values
                )
            return len(entries)

    # ═══════════════════════════════════════════════════════════
    # LECTURE GROUPS
    # ═══════════════════════════════════════════════════════════

    async def create_lecture_group(self, name: str, subject_id: int,
                                semester: str | None, assignment_ids: list[int]) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                "INSERT INTO lecture_groups (name, subject_id, semester) VALUES (%s, %s, %s)",
                (name, subject_id, semester)
            )
            group_id = cur.lastrowid
            for aid in assignment_ids:
                await cur.execute(
                    "INSERT INTO lecture_group_members (lecture_group_id, assignment_id) VALUES (%s, %s)",
                    (group_id, aid)
                )
        return await self.get_lecture_group(group_id)

    async def get_lecture_group(self, group_id: int) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("SELECT * FROM lecture_groups WHERE id=%s", (group_id,))
            group = await cur.fetchone()
            if not group:
                return None
            await cur.execute(
                "SELECT * FROM lecture_group_members WHERE lecture_group_id=%s",
                (group_id,)
            )
            group["members"] = await cur.fetchall()
            return group

    async def get_all_lecture_groups(self) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("SELECT * FROM lecture_groups ORDER BY id")
            groups = await cur.fetchall()
            for g in groups:
                await cur.execute(
                    "SELECT * FROM lecture_group_members WHERE lecture_group_id=%s",
                    (g["id"],)
                )
                g["members"] = await cur.fetchall()
            return groups

    async def delete_lecture_group(self, group_id: int) -> bool:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("DELETE FROM lecture_groups WHERE id=%s", (group_id,))
            return cur.rowcount > 0

    # ═══════════════════════════════════════════════════════════
    # GENERATOR DATA FETCHING (bulk queries for algorithm)
    # ═══════════════════════════════════════════════════════════

    async def fetch_assignments_for_generation(self, semester: str | None = None) -> list[dict]:
        """
        Fetch all assignments with subject info (weekly_hours, required_room_type)
        and section capacity for the generator algorithm.
        """
        async with self.conn.cursor(DictCursor) as cur:
            query = """
                SELECT
                    sa.id              AS assignment_id,
                    sa.user_id         AS teacher_id,
                    u.full_name        AS teacher_name,
                    sa.subject_id,
                    s.name             AS subject_name,
                    COALESCE(s.weekly_hours, 1) AS weekly_hours,
                    COALESCE(s.required_room_type, 'NORMAL') AS required_room_type,
                    sa.section_id,
                    sec.number         AS section_number,
                    sec.capacity       AS section_capacity,
                    sa.semester
                FROM subject_assignments sa
                JOIN users     u   ON u.id  = sa.user_id
                JOIN subjects  s   ON s.id  = sa.subject_id
                JOIN sections  sec ON sec.id = sa.section_id
            """
            params = []
            if semester:
                query += " WHERE sa.semester = %s"
                params.append(semester)
            query += " ORDER BY sa.id"
            await cur.execute(query, params)
            return await cur.fetchall()

    async def fetch_lecture_group_map(self) -> dict:
        """
        Returns a dict mapping assignment_id -> {group_id, total_capacity, member_assignment_ids}
        for all assignments that are part of a lecture group.
        """
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                SELECT
                    lgm.assignment_id,
                    lgm.lecture_group_id,
                    lg.name AS group_name
                FROM lecture_group_members lgm
                JOIN lecture_groups lg ON lg.id = lgm.lecture_group_id
            """)
            rows = await cur.fetchall()

        # Build mapping: group_id -> list of assignment_ids
        groups = {}
        for row in rows:
            gid = row["lecture_group_id"]
            if gid not in groups:
                groups[gid] = {
                    "group_id": gid,
                    "group_name": row["group_name"],
                    "assignment_ids": [],
                }
            groups[gid]["assignment_ids"].append(row["assignment_id"])

        # Build mapping: assignment_id -> group info
        result = {}
        for group_info in groups.values():
            for aid in group_info["assignment_ids"]:
                result[aid] = group_info

        return result

    async def fetch_active_rooms(self) -> list[dict]:
        """Fetch all active rooms for the generator."""
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                "SELECT id, name, capacity, room_type FROM rooms WHERE is_active = TRUE ORDER BY capacity DESC"
            )
            return await cur.fetchall()
