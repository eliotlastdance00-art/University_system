from aiomysql import DictCursor

from .schemas import ChCreate, ChUpdate


class CohortRepository:
    def __init__(self, conn):
        self.conn = conn

    async def create(self, data: ChCreate):
        async with self.conn(DictCursor) as cur:
            await cur.execute(
                """
                INSERT INTO cohorts
                (program_id,academic_year_id)   
                VALUES (%s,%s)
                """,
                (data.program_id, data.academic_year_id),
            )
        await self.conn.commit()

    async def get_all(self) -> list[dict]:
        async with self.conn(DictCursor) as cur:
            await cur.execute("""
                                SELECT * FROM cohorts
                            """)
            result = await cur.fetchall()
        return result

    async def get_by_id(self, id: int) -> dict | None:
        async with self.conn(DictCursor) as cur:
            await cur.execute(
                """
                                SELECT * FROM cohorts WHERE id=%s
                            """,
                (id,),
            )
            result = await cur.fetchone()
        return result

    async def update(self,id:int , data: ChUpdate):
        async with self.conn(DictCursor) as cur:
            await cur.execute(
                """
                UPDATE cohorts
                SET program_id=%s,academic_year_id=%s
                WHERE id=%s
                """,
                (data.program_id, data.academic_year_id,id),
            )
        await self.conn.commit()

    async def delete(self, id: int):
        async with self.conn(DictCursor) as cur:
            await cur.execute(
                """
                DELETE FROM cohorts
                WHERE id=%s
                """,
                (id,),
            )
        await self.conn.commit()

    async def get_by_name(self, name: str) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                                SELECT * FROM cohorts WHERE name=%s
                            """,
                (name,),
            )
            result = await cur.fetchone()
        return result

    async def get_by_program_id(self, program_id: int) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                                SELECT * FROM cohorts WHERE program_id=%s
                            """,
                (program_id,),
            )
            result = await cur.fetchall()
        return result

    async def get_by_program_id_and_academic_year_id(
        self, program_id: int, academic_year_id: int
    ) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                                SELECT * FROM cohorts WHERE program_id=%s AND academic_year_id=%s
                            """,
                (program_id, academic_year_id),
            )
            result = await cur.fetchone()
        return result
