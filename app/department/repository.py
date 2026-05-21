from aiomysql import  DictCursor


class DepartmentRepository:
    def __init__(self, conn):
        self.conn = conn

    #---------------Get all department-faculty------------
    async def get_all_department_faculty(self, id: int) -> list[dict]:
        sql = """
            SELECT 
                d.id,
                d.name,
                d.faculty_id,
                f.name AS faculty_name
            FROM departments d
            JOIN faculties f ON d.faculty_id = f.id
            WHERE d.faculty_id = %s
        """
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (id,))
            result = await cursor.fetchall()
        return result

    async def get_departments_incrementally(
        self,
        last_id: int = 0,
        limit: int = 10,
    ) -> list[dict]:
        query = """
            SELECT 
                d.id,
                d.name,
                d.faculty_id,
                f.name AS faculty_name
            FROM departments d
            JOIN faculties f ON d.faculty_id = f.id
            WHERE d.id > %s
            ORDER BY d.id ASC
            LIMIT %s
        """
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(query, (last_id, limit))
            result = await cursor.fetchall()
        return result

    #-----------------GET {id}-----------------------
    async def get_department_by_id(self, id: int) -> dict | None:
        sql = """
            SELECT  
                d.id,
                d.name,
                d.faculty_id,
                f.name AS faculty_name
            FROM departments d
            JOIN faculties f ON d.faculty_id = f.id
            WHERE d.id = %s
        """
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (id,))
            return await cursor.fetchone()

    #-----------------GET {name}-----------------------
    async def get_department_by_name(self, name: str) -> dict | None:
        sql = """
            SELECT *
            FROM departments
            WHERE name = %s
        """
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (name,))
            result = await cursor.fetchone()
        return result

    #-----------------POST DEPARTMENT---------------------
    async def create_department(self, name: str, faculty_id: int) -> None:
        sql = "INSERT INTO departments(name, faculty_id) VALUES (%s, %s)"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (name, faculty_id))
        await self.conn.commit()

    #----------------PUT DEPARTMENT-------------------
    async def update_department(
        self,
        id: int,
        name: str,
        faculty_id: int,
    ) -> None:
        sql = "UPDATE departments SET name = %s, faculty_id = %s WHERE id = %s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (name, faculty_id,id))
        await self.conn.commit()

    #--------------DELETE DEPARTMENT--------------------
    async def delete_department(self, id: int) -> None:
        sql = "DELETE FROM departments WHERE id = %s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (id,))
        await self.conn.commit()

    async def get_department_teachers(self,department_id:int)->list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                            SELECT
                                u.id,
                                u.full_name,
                                u.email
                                FROM users u
                                JOIN user_profiles up ON u.id=up.user_id
                                JOIN user_roles    ur ON u.id=ur.user_id
                                JOIN roles         r  ON ur.role_id=r.id
                                WHERE up.`department_id`=1 AND r.name="teacher"
                            """,(department_id,))
            await cur.fetchall()    

    async def get_department_students(self,department_id:int)->list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                            SELECT
                                u.id,
                                u.full_name,
                                u.email
                                FROM users u
                                JOIN user_profiles up ON u.id=up.user_id
                                JOIN user_roles    ur ON u.id=ur.user_id
                                JOIN roles         r  ON ur.role_id=r.id
                                WHERE up.`department_id`=%s AND r.name="student"
                            """,(department_id,))
            await cur.fetchall()            