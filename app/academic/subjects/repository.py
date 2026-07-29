from aiomysql import Connection, DictCursor


class SubjectRepository:
    def __init__(self, conn: Connection):
        self.conn = conn

    # -----------CREATE SUBJECT--------------
    async def create_subject(self, name: str, credits: int, department_id: int) -> int:
        sql = "INSERT INTO subjects(name,credits,department_id) VALUES (%s,%s,%s)"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (name, credits, department_id))
            await self.conn.commit()
            return cursor.lastrowid

    # --------------Update Subject--------------------
    async def update_subject(
        self, subject_id: int, name: str, credits: int, department_id: int
    ):
        sql = "UPDATE subjects SET name=%s,credits=%s,department_id=%s WHERE id=%s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (name, credits, department_id, subject_id))
            return await self.conn.commit()

    # ----------------Get all SUBJECTS----------------
    async def get_all_subjects(self):
        sql = """SELECT
                s.id,
                s.name,
                s.credits,
                s.department_id,
                d.name AS department_name FROM subjects s JOIN departments d ON s.department_id=d.id"""
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql)
            return await cursor.fetchall()

    # ============GET ALL SUBJECTS DEPARTMENT===============
    async def get_all_subjects_department(self, department_id: int):
        sql = """SELECT
                s.id,
                s.name,
                s.credits,
                s.department_id,
                d.name AS department_name FROM subjects s JOIN departments d ON s.department_id=d.id WHERE s.department_id=%s"""
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (department_id,))
            return await cursor.fetchall()

    # ============GET ALL SUBJECTS FACULTY===============
    async def get_all_subjects_faculty(self, faculty_id: int):
        sql = """SELECT
                s.id,
                s.name,
                s.credits,
                s.department_id,
                d.name AS department_name ,
                d.faculty_id,
                f.name AS faculty_name 
                FROM subjects s
                JOIN departments d ON s.department_id=d.id 
                JOIN faculties   f ON d.faculty_id=f.id
                WHERE d.faculty_id=%s"""
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (faculty_id,))
            return await cursor.fetchall()

    # -------------Get id subjects-------------------
    async def get_id_subjects(self, id: int):
        sql = "SELECT id,name,credits,department_id FROM subjects WHERE id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (id,))
            return await cursor.fetchone()

    # =============GET NAME SUBJECTS=================
    async def get_name_subjects(self, name: str, department_id: int):
        sql = "SELECT id,name,credits,department_id FROM subjects WHERE name=%s AND department_id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (name, department_id))
            return await cursor.fetchone()
