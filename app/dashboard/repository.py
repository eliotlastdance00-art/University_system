import aiomysql


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