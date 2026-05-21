from aiomysql import DictCursor

from .schemas import SectionCreate, UpdateSection


class SectionRepository:
    def __init__(self, conn):
        self.conn = conn

    async def create_section(self, data: SectionCreate):
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                INSERT INTO sections
                (cohort_id,number,capacity)
                VALUES
                (%s,%s,%s)
                """,
                (data.cohort_id, data.number, data.capacity),
            )
            await self.conn.commit()

    async def get_all_sections(self, skip: int, limit: int) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                             SELECT *  FROM sections
                            LIMIT %s OFFSET %s
                            """,
                (limit, skip),
            )
            result = await cur.fetchall()
        return result
    

    async def get_section_by_id(self, id: int) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                             SELECT *  FROM sections
                            WHERE id=%s
                            """,
                (id,),
            )
            result = await cur.fetchone()
        return result
    


    async def update_section(self,id:int, data: UpdateSection) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                UPDATE sections
                SET cohort_id=%s, number=%s, capacity=%s
                WHERE id=%s
                """,
                (data.cohort_id, data.number, data.capasity,id),
            )
            await self.conn.commit()
            return await self.get_section_by_id(id)
        

    async def delete_section(self, id: int) -> bool:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                DELETE FROM sections
                WHERE id=%s
                """,
                (id,),
            )
            await self.conn.commit()
            return cur.rowcount > 0

    async def get_sections_by_cohort_id(self, cohort_id: int) -> list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                SELECT * FROM sections
                WHERE cohort_id=%s
                """,
                (cohort_id,),
            )
            result = await cur.fetchall()
        return result




    async def get_section_by_number_and_cohort_id(self, number: int, cohort_id: int) -> dict | None:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute(
                """
                SELECT * FROM sections
                WHERE number=%s AND cohort_id=%s
                """,
                (number, cohort_id),
            )
            result = await cur.fetchone()
        return result 


    async def get_section_students(self,id:int)->list[dict]:
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
                                WHERE up.section_id=%s AND r.name="student"
                    """,(id,)) 
            await cur.fetchall()      


    async def get_section_timetable(self,id:int)->list[dict]:
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
                                WHERE up.section_id=%s AND r.name="student"
                    """,(id,)) 
            await cur.fetchall()      
