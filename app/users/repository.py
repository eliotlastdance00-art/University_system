from aiomysql import DictCursor

from app.core.security import hash_password


class UsersRepository:
    def __init__(self, conn):
        self.conn = conn

    async def create_user(self, full_name: str, email: str, password: str):
        hash_pass = hash_password(password)
        sql = "INSERT INTO users(full_name,email,password) VALUES (%s,%s,%s)"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (full_name, email, hash_pass))
            return await self.conn.commit()

    async def get_all_users(self):
        sql = "SELECT * FROM users"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql)
            return await cursor.fetchall()

    async def get_by_id_users(self, user_id: int):
        sql = "SELECT id,full_name,email,is_active FROM users WHERE id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (user_id,))
            return await cursor.fetchone()

    async def get_by_email_users(self, email: str):
        sql = "SELECT id,full_name,email,is_active FROM users WHERE email=%s "
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (email,))
            return await cursor.fetchone()

    async def update_user(
        self, user_id: int, full_name: str, email: str, password: str, is_active: bool
    ):
        hash_pass = hash_password(password)
        sql = "UPDATE users SET  full_name=%s,email=%s,password=%s,is_active=%s WHERE id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (full_name, email, hash_pass, is_active, user_id))
        return await self.conn.commit()

    async def delete_user(self, user_id: int):
        sql = "DELETE FROM users WHERE id=%s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (user_id,))
        return await self.conn.commit()

    async def role_by_id(self, role_id: int):
        sql = "SELECT id,name FROM roles WHERE id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (role_id,))
            return await cursor.fetchone()

    async def get_user_role(self, user_id: int, role_id: int):
        sql = (
            "SELECT id,user_id,role_id FROM user_roles WHERE user_id=%s and role_id=%s"
        )
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (user_id, role_id))
            return await cursor.fetchone()

    async def assign_role(self, user_id: int, role_id: int):
        sql = "INSERT INTO user_roles(user_id,role_id) VALUES (%s,%s)"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (user_id, role_id))
        return await self.conn.commit()

    async def assign_profile(
        self,
        user_id: int,
        faculty_id: int = None,
        department_id: int = None,
        section_id: int = None,
    ):
        if not faculty_id and not department_id and not section_id:
            return
        sql = "INSERT INTO user_profiles(user_id,faculty_id,department_id,section_id) VALUES (%s,%s,%s,%s)"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (user_id, faculty_id, department_id, section_id))
        return await self.conn.commit()

    async def get_user_roles_all(self, user_id: int):
        sql = "SELECT * FROM user_roles WHERE user_id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (user_id,))
            return await cursor.fetchall()

    async def remove_role(self, user_id: int, role_id: int):
        sql = "DELETE FROM user_roles WHERE user_id=%s AND role_id=%s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (user_id, role_id))
        await self.conn.commit()
