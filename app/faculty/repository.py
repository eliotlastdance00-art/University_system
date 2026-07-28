# ================================================
#                MySQL scriptleri
# ================================================


from aiomysql import DictCursor


class FacultyRepository:
    def __init__(self, conn):
        self.conn = conn

    # --------Add Faculty--------
    async def create_faculty(self, name: str, code: str) -> dict |None:
        sql = "INSERT INTO faculties(name,code) VALUES (%s,%s)"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (name, code))
            await self.conn.commit()

    # --------Get all Faculty----------

    async def get_all_faculty(self) -> list[dict]:
        sql = "SELECT * FROM faculties"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql)
            result = await cursor.fetchall()
        return result

    # -----------Get{code}---------------

    async def get_faculty_by_code(self, code: str) -> list[dict]:
        sql = "SELECT id,name,code FROM faculties WHERE code=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (code,))
            return await cursor.fetchone()

    # -----------Get{id}---------------

    async def get_faculty_by_id(self, id: int) -> list[dict]:
        sql = "SELECT id,name,code FROM faculties WHERE id=%s"
        async with self.conn.cursor(DictCursor) as cursor:
            await cursor.execute(sql, (id,))
            result = await cursor.fetchone()
        return result

    # -----------Update Faculty-----------

    async def update_faculty(self, id: int, name: str, code: str) -> dict | None:
        sql = "UPDATE faculties set name=%s,code=%s where id=%s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (name, code, id))
            await self.conn.commit()

    # -----------Delete Faculty--------------

    async def delete_faculty(self, id: int) -> dict | None:
        sql = "DELETE FROM faculties WHERE id=%s"
        async with self.conn.cursor() as cursor:
            await cursor.execute(sql, (id))
            await self.conn.commit()
