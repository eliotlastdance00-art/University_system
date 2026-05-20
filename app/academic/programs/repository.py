from aiomysql import DictCursor

from .schemas import ProgramCreate, ProgramUpdate


class ProgramRepository:
    def __init__(self, conn):
        self.conn = conn

    async def create(self, data: ProgramCreate):
        async with self.conn(DictCursor) as cur:
            await cur.execute(
                """
                            INSERT 
                            INTO 
                            programs
                            (name,code,department_id)
                            VALUES (%s,%s,%s)
                            """,
                (data.name, data.code, data.department_id),
            )
        await self.conn.commit()

    async def update(self, data: ProgramUpdate):
        async with self.conn(DictCursor) as cur:
            await cur.execute(
                """
                                UPDATE
                                programs
                                SET
                                name=%s,code=%s,department_id=%s
                                WHERE id=%s
                            """,
                (data.name, data.code, data.department_id, data.id),
            )
            await self.conn.commit()

    async def get_all_programm(self) -> list[dict]:
        async with self.conn(DictCursor) as cur:
            await cur.execute("""
                                SELECT * FROM programs
                            """)
            await cur.fetchall()

    async def get_by_id_programm(self, id: int) -> list[dict]:
        async with self.conn(DictCursor) as cur:
            await cur.execute(
                """
                                SELECT * FROM programs WHERE id=%s
                            """,
                (id,),
            )
            await cur.fetchone()
    async def get_by_name_programm(self, name: str) -> list[dict]:
        async with self.conn(DictCursor) as cur:
            await cur.execute(
                """
                                SELECT * FROM programs WHERE name=%s
                            """,
                (name,),
            )
            await cur.fetchone()        

    async def delete(self, id: int):
        async with self.conn(DictCursor) as cur:
            await cur.execute("DELETE FROM programs WHERE id=%s", (id,))
        await self.conn.commit()
