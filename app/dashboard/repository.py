from aiomysql import DictCursor



class DashboardRepository:
    def __init__(self,conn):
        self.conn=conn



    async def get_dashboard_admin(self)->list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                            """) 
            await cur.fetchall() 

    async def get_dashboard_teacher(self)->list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                            """)
            await cur.fetchall()  


    async def get_dashboard_student(self)->list[dict]:
        async with self.conn.cursor(DictCursor) as cur:
            await cur.execute("""
                            """) 
            await cur.fetchall()                       