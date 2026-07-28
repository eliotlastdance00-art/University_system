import json

from aiomysql import DictCursor

from app.academic.grades.schemas import GradeCreate


class GradeRepository:
    def __init__(self, conn):
        self.conn = conn

    async def create(self, data: GradeCreate, created_by: int) -> int:
        async with self.conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO grades (student_id, subject_id, assignment_id, score, max_score, weight, comment, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    data.student_id,
                    data.subject_id,
                    data.assignment_id,
                    data.score,
                    data.max_score,
                    data.weight,
                    data.comment,
                    created_by,
                ),
            )
            return cur.lastrowid

    async def update(self, grade_id: int, updates: dict):
        if not updates:
            return
        fields = []
        values = []
        for k, v in updates.items():
            fields.append(f"{k} = %s")
            values.append(v)
        values.append(grade_id)

        async with self.conn.cursor() as cur:
            await cur.execute(
                f"UPDATE grades SET {', '.join(fields)} WHERE id = %s", values
            )

    async def delete(self, grade_id: int):
        async with self.conn.cursor() as cur:
            await cur.execute("DELETE FROM grades WHERE id = %s", (grade_id,))

    async def get_by_id(self, grade_id: int):
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("SELECT * FROM grades WHERE id = %s", (grade_id,))
            return await cur.fetchone()

    async def get_by_student(self, student_id: int):
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                "SELECT * FROM grades WHERE student_id = %s", (student_id,)
            )
            return await cur.fetchall()


class AuditLogRepository:
    def __init__(self, conn):
        self.conn = conn

    async def log_action(
        self,
        actor_id: int,
        action: str,
        entity_name: str,
        entity_id: int,
        old_value: dict | None,
        new_value: dict | None,
    ):
        # MySQL JSON requires stringified dicts, replace datetimes with strings if any
        def convert_datetime(obj):
            if isinstance(obj, dict):
                return {k: convert_datetime(v) for k, v in obj.items()}
            elif hasattr(obj, "isoformat"):
                return obj.isoformat()
            return obj

        safe_old = convert_datetime(old_value) if old_value else None
        safe_new = convert_datetime(new_value) if new_value else None

        async with self.conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO audit_logs (actor_id, action, entity_name, entity_id, old_value, new_value)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    actor_id,
                    action,
                    entity_name,
                    entity_id,
                    json.dumps(safe_old) if safe_old else None,
                    json.dumps(safe_new) if safe_new else None,
                ),
            )
