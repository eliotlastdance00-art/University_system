from datetime import datetime

from aiomysql import DictCursor

from .schemas import SaveRefreshToken


class AuthRepository:
    def __init__(self, conn):
        self.conn = conn

    async def get_user_for_login(self, email: str):
        sql = """
        SELECT 
            u.id,
            u.full_name,
            u.password,
            u.is_active,
            u.email,
            r.name AS role
            FROM users u 
            JOIN user_roles ur ON u.id=ur.user_id
            JOIN roles r  ON ur.role_id=r.id
            WHERE u.email=%s
            ORDER BY r.level ASC
            LIMIT 1
        """
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (email,))
            return await cursor.fetchone()

    async def save_refresh_token(self, data: SaveRefreshToken):
        sql = "INSERT INTO refresh_tokens(user_id,token,expires_at,is_revoked) VALUES(%s,%s,%s,%s)"
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                sql, (data.user_id, data.token, data.expires_at, data.is_revoked)
            )
        await self.conn.commit()

    async def get_refresh_token(self, token: str) -> list[dict]:
        sql = """SELECT
                    r.id,
                    r.user_id,
                    u.name AS user_name,
                    r.token,
                    r.expires_at,
                    r.is_revoked
                    FROM refresh_tokens r
                    JOIN users u ON r.user_id=u.id
                    WHERE r.token=%s
                    """
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(sql, (token,))
            return await cur.fetchall()

    async def revoke_token(self, token: str) -> dict:
        sql = """
            UPDATE
            refresh_tokens
            SET
            is_revoked=1
            WHERE token=%s
            """
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(sql, (token,))
            await self.conn.commit()

    async def revoke_all_token(self, user_id) -> dict:
        sql = """
            UPDATE
            refresh_tokens
            SET
            is_revoked=1
            WHERE user_id=%s
            """
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(sql, (user_id,))
            await self.conn.commit()

    async def old_token_change_new_token(
        self, old_token: str, new_token: str, expires_at: datetime
    ) -> bool:
        sql = """
            UPDATE
            refresh_tokens
            SET
            token=%s,expires_at = %s
            WHERE token=%s
            """
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(sql, (new_token, expires_at, old_token))
            await self.conn.commit()
            return cur.rowcount > 0

    async def activate_user_by_email(self, email: str) -> bool:
        sql = "UPDATE users SET is_active = 1 WHERE email = %s"
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(sql, (email,))
            await self.conn.commit()
            return cur.rowcount > 0

    async def find_id(self, department: str):
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                "SELECT id,faculty_id FROM departments WHERE name=%s", (department)
            )
            return await cur.fetchall()
