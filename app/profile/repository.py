from aiomysql import DictCursor


class ProfileRepository:
    def __init__(self, conn):
        self.conn = conn

    async def get_profile_me(self, id)-> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                            SELECT 
                            u.id, 
                            u.full_name, 
                            u.email,
                            f.name as faculty,
                            d.name as department,
                            s.number as section_number,
                            r.name as role
                            FROM users u
                        LEFT JOIN user_profiles up ON u.id = up.user_id
                        LEFT JOIN faculties f ON up.faculty_id = f.id
                        LEFT JOIN departments d ON up.department_id = d.id
                        LEFT JOIN sections s ON up.section_id = s.id
                        LEFT JOIN user_roles ur ON u.id = ur.user_id
                        LEFT JOIN roles r ON ur.role_id = r.id
                        WHERE u.id = %s
                        """, (id,))
            result = await cur.fetchone()
        return result
    async def get_profile_by_email(self, email:str)-> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                            SELECT 
                            u.id, 
                            u.full_name, 
                            u.email,
                            f.name as faculty,
                            d.name as department,
                            s.number as section_number,
                            r.name as role
                            FROM users u
                        LEFT JOIN user_profiles up ON u.id = up.user_id
                        LEFT JOIN faculties f ON up.faculty_id = f.id
                        LEFT JOIN departments d ON up.department_id = d.id
                        LEFT JOIN sections s ON up.section_id = s.id
                        LEFT JOIN user_roles ur ON u.id = ur.user_id
                        LEFT JOIN roles r ON ur.role_id = r.id
                        WHERE u.email = %s
                        """, (email,))
            result = await cur.fetchone()
        return result
    

    async def update_profile_me(self, id:int, full_name:str, email:str, faculty_id:int, department_id:int, section_id:int):
        async with self.conn.cursor() as cur:
            await cur.execute("""
                            UPDATE users 
                            SET full_name = %s, email = %s
                            WHERE id = %s
                            """, (full_name, email, id))
            await cur.execute("""
                            UPDATE user_profiles 
                            SET faculty_id = %s, department_id = %s, section_id = %s
                            WHERE user_id = %s
                            """, (faculty_id, department_id, section_id, id))
            await self.conn.commit()

    async def update_password_me(self, id:int, new_password:str):
        async with self.conn.cursor() as cur:
            await cur.execute("""
                            UPDATE users 
                            SET password = %s
                            WHERE id = %s
                            """, (new_password, id))
            await self.conn.commit()        
