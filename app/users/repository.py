from aiomysql import DictCursor


class UsersRepository:
    def __init__(self, conn):
        self.conn = conn

    async def create_user(self, full_name: str, email: str, password: str):
        sql = "INSERT INTO users(full_name,email,password) VALUES (%s,%s,%s)"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (full_name, email, password))

    async def get_all_users(self):
        sql = """
        SELECT 
        u.id, u.full_name, u.email, u.is_active,
        up.faculty_id, up.department_id, up.section_id
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        """
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql)
            return await cursor.fetchall()

    async def get_by_id_users(self, id: int):
        sql = """
        SELECT u.id, u.full_name, u.email, u.is_active, up.section_id
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = %s
        """
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (id,))
            return await cursor.fetchone()

    async def get_by_email_users(self, email: str):
        sql = "SELECT id,full_name,email,is_active FROM users WHERE email=%s "
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (email,))
            return await cursor.fetchone()

    async def update_user(
        self, id: int, full_name: str, email: str, password: str, is_active: bool
    ):
        sql = "UPDATE users SET full_name=%s,email=%s,password=%s,is_active=%s WHERE id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (full_name, email, password, is_active, id))

    async def update_user_without_password(
        self, id: int, full_name: str, email: str, is_active: bool
    ):
        sql = "UPDATE users SET full_name=%s, email=%s, is_active=%s WHERE id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (full_name, email, is_active, id))

    async def delete_user(self, id: int):
        sql = "DELETE FROM users WHERE id=%s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (id,))

    async def role_by_id(self, role_id: int):
        sql = "SELECT id,name FROM roles WHERE id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (role_id,))
            return await cursor.fetchone()

    async def get_role_by_name(self, name: str):
        sql = "SELECT id, name FROM roles WHERE name=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (name,))
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

    async def assign_profile(
        self,
        user_id: int,
        faculty_id: int | None,
        department_id: int | None,
        section_id: int | None,
    ):
        if not faculty_id and not department_id and not section_id:
            return
        sql = "INSERT INTO user_profiles(user_id,faculty_id,department_id,section_id) VALUES (%s,%s,%s,%s)"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (user_id, faculty_id, department_id, section_id))

    async def get_user_roles_all(self, user_id: int):
        sql = "SELECT * FROM user_roles WHERE user_id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (user_id,))
            return await cursor.fetchall()

    async def remove_role(self, user_id: int, role_id: int):
        sql = "DELETE FROM user_roles WHERE user_id=%s AND role_id=%s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (user_id, role_id))

    async def search_users(
        self,
        name: str | None,
        role: str | None,
        faculty_id: int | None,
        department_id: int | None,
        section_id: int | None,
    ) -> list[dict]:
        sql = """
        SELECT 
            u.id,
            u.full_name,
            u.email,
            u.is_active,
            up.faculty_id,
            up.department_id,
            up.section_id,
            r.name as role
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE 1=1
    """
        params = []
        if name:
            sql += " AND u.full_name LIKE %s"
            params.append(f"%{name}%")
        if role:
            sql += " AND r.name=%s"
            params.append(role)
        if department_id:
            sql += " AND up.department_id=%s"
            params.append(department_id)
        if faculty_id:
            sql += " AND up.faculty_id=%s"
            params.append(faculty_id)
        if section_id:
            sql += " AND up.section_id=%s"
            params.append(section_id)

        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, params)
            return await cursor.fetchall()

    async def get_section_by_id(self, section_id: int):
        """Gulplamasyz okamak — diňe maglumat görkezmek üçin (mm. section detail sahypasy)."""
        sql = "SELECT id, capacity FROM sections WHERE id = %s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (section_id,))
            return await cursor.fetchone()

    async def get_section_by_id_for_update(self, section_id: int):
        """
        Setiri gulplap okaýar (SELECT ... FOR UPDATE).
        Diňe açyk transaction içinde (self.conn.begin() soň) ulanylmaly —
        ýogsam autocommit sebäpli gulplama derrew boşap gidýär we
        capacity barlagy bilen update arasyndaky race condition-dan goramaýar.
        """
        sql = "SELECT id, capacity FROM sections WHERE id = %s FOR UPDATE"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (section_id,))
            return await cursor.fetchone()

    async def get_section_student_count(self, section_id: int):
        sql = "SELECT COUNT(*) as total FROM user_profiles WHERE section_id = %s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (section_id,))
            return await cursor.fetchone()

    async def update_user_section(self, user_id: int, section_id: int):
        sql = "UPDATE user_profiles SET section_id = %s WHERE user_id = %s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (section_id, user_id))
