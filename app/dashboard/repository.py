import aiomysql
from datetime import date


# ─── Notification Queries ───────────────────────────────────


async def get_recent_notifications(conn: aiomysql.Connection, user_id: int, limit: int = 5) -> list[dict]:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT id, sender_id, title, body, is_read, created_at
            FROM notification_log
            WHERE receiver_id = %s
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (user_id, limit),
        )
        return await cur.fetchall()


async def get_unread_notification_count(conn: aiomysql.Connection, user_id: int) -> int:
    async with conn.cursor() as cur:
        await cur.execute(
            """
            SELECT COUNT(*) FROM notification_log
            WHERE receiver_id = %s AND is_read = 0
            """,
            (user_id,),
        )
        row = await cur.fetchone()
        return row[0]


# ─── Count Queries ──────────────────────────────────────────


async def get_total_users(conn: aiomysql.Connection) -> int:
    async with conn.cursor() as cur:
        await cur.execute("SELECT COUNT(*) FROM users WHERE is_active = 1")
        row = await cur.fetchone()
        return row[0]


async def get_total_students(conn: aiomysql.Connection) -> int:
    async with conn.cursor() as cur:
        await cur.execute(
            """
            SELECT COUNT(DISTINCT ur.user_id)
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE r.name = 'student'
            """
        )
        row = await cur.fetchone()
        return row[0]


async def get_total_teachers(conn: aiomysql.Connection) -> int:
    async with conn.cursor() as cur:
        await cur.execute(
            """
            SELECT COUNT(DISTINCT ur.user_id)
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE r.name = 'teacher'
            """
        )
        row = await cur.fetchone()
        return row[0]


async def get_total_faculties(conn: aiomysql.Connection) -> int:
    async with conn.cursor() as cur:
        await cur.execute("SELECT COUNT(*) FROM faculties")
        row = await cur.fetchone()
        return row[0]


async def get_total_departments(conn: aiomysql.Connection) -> int:
    async with conn.cursor() as cur:
        await cur.execute("SELECT COUNT(*) FROM departments")
        row = await cur.fetchone()
        return row[0]


async def get_total_sections(conn: aiomysql.Connection) -> int:
    async with conn.cursor() as cur:
        await cur.execute("SELECT COUNT(*) FROM sections")
        row = await cur.fetchone()
        return row[0]


async def get_total_subjects(conn: aiomysql.Connection) -> int:
    async with conn.cursor() as cur:
        await cur.execute("SELECT COUNT(*) FROM subjects")
        row = await cur.fetchone()
        return row[0]


# ─── Rich Data Queries ──────────────────────────────────────


async def get_active_academic_year(conn: aiomysql.Connection) -> dict | None:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT id, year_start, year_end, is_active
            FROM academic_years
            WHERE is_active = 1
            LIMIT 1
            """
        )
        return await cur.fetchone()


async def get_role_distribution(conn: aiomysql.Connection) -> list[dict]:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT r.name AS role, COUNT(ur.user_id) AS count
            FROM roles r
            LEFT JOIN user_roles ur ON ur.role_id = r.id
            GROUP BY r.id, r.name
            ORDER BY count DESC
            """
        )
        return await cur.fetchall()


async def get_recent_audit_logs(conn: aiomysql.Connection, limit: int = 10) -> list[dict]:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT al.id, al.action, al.entity_name, al.entity_id,
                   al.timestamp, u.full_name AS actor_name
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.actor_id
            ORDER BY al.timestamp DESC
            LIMIT %s
            """,
            (limit,),
        )
        return await cur.fetchall()


async def get_today_lessons_count(conn: aiomysql.Connection) -> int:
    async with conn.cursor() as cur:
        await cur.execute(
            """
            SELECT COUNT(*) FROM lessons
            WHERE date = %s
            """,
            (date.today(),),
        )
        row = await cur.fetchone()
        return row[0]


async def get_overall_attendance_rate(conn: aiomysql.Connection) -> float:
    async with conn.cursor() as cur:
        await cur.execute(
            """
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count
            FROM attendance
            """
        )
        row = await cur.fetchone()
        total, present = row[0], row[1] or 0
        if total == 0:
            return 0.0
        return round((present / total) * 100, 1)