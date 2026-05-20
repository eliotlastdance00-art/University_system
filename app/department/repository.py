from aiomysql import Connection, DictCursor


class DepartmentRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    #---------------Get all department-faculty------------
    async def get_all_department_faculty(self, faculty_id: int) -> list[dict]:
        sql = """
            SELECT 
                d.id,
                d.name,
                d.faculty_id,
                f.name AS faculty_name
            FROM departments d
            JOIN faculties f ON d.faculty_id = f.id
            WHERE faculty_id = %s
        """
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (faculty_id,))
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
    async def get_department_by_id(self, department_id: int) -> dict | None:
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
            await cursor.execute(sql, (department_id,))
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
        department_id: int,
        name: str,
        faculty_id: int,
    ) -> None:
        sql = "UPDATE departments SET name = %s, faculty_id = %s WHERE id = %s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (name, faculty_id, department_id))
        await self.conn.commit()

    #--------------DELETE DEPARTMENT--------------------
    async def delete_department(self, department_id: int) -> None:
        sql = "DELETE FROM departments WHERE id = %s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (department_id,))
        await self.conn.commit()