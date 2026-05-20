from aiomysql import DictCursor

from .schemas import Academic_yearCreate, Academic_yearUpdate


class AcademicYearRepository:
    def __init__(self, conn):
        self.conn = conn

    async def create(self, data: Academic_yearCreate) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                INSERT INTO
                academic_years
                (year_start,year_end)
                VALUES
                (%s,%s)
                """,
                (data.year_start, data.year_end),
            )
            await self.conn.commit()

    async def update(self, data: Academic_yearUpdate) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                            UPDATE 
                            academic_years
                            SET 
                            year_start=%s,
                            year_end=%s,
                            is_active=%s
                            WHERE id=%s
                            """,
                (data.year_start, data.year_end, data.is_active, data.id),
            )
            await self.conn.commit()

    async def get_all(self) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                             SELECT *  FROM academic_years
                            """)
            result = await cur.fetchall()
        return result

    async def get_by_id(self, id: int) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                            SELECT *  FROM academic_years
                            WHERE id=%s
                            """,
                (id,),
            )
            result = await cur.fetchone()
        return result
