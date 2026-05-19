from aiomysql import DictCursor

from .schemas import Acedemic_yearCreate, Acedemic_yearUpdate


class AcedemicYearRepository:
    def __init__(self, conn):
        self.conn = conn

    async def create(self, data: Acedemic_yearCreate) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                INSERT INTO
                acedemic_years
                (year_start,year_end)
                VALUES
                (%s,%s)
                """,
                (data.year_start, data.year_end),
            )
            await self.conn.commit()
        return {"message": "Succesfully created years"}

    async def update(self, data: Acedemic_yearUpdate, id: int) -> dict:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                            UPDATE 
                              acedemic_years
                              SET 
                              year_start=%s,
                              year_end=%s,
                              is_active=%s
                            WHERE id=%s
                             """,
                (data.year_start, data.year_end, data.is_active, id),
            )
            await self.conn.commit()
        return {"message": "Succesfully updated"}

    async def get_all(self) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                             SELECT *  FROM academic_years
                             """)
            result = await cur.fetchall()
        return result
