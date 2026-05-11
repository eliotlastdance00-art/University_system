from aiomysql import Connection,DictCursor

async def get_user_for_login(conn:Connection,email:str):
    sql="""
         SELECT 
               u.id,
               u.full_name,
               u.password,
               u.is_active,
               r.name AS role
               FROM users u 
               JOIN user_roles ur ON u.id=ur.user_id
               JOIN roles r  ON ur.role_id=r.id
               WHERE u.email=%s
               ORDER BY r.level ASC
               LIMIT 1
        """
    async with conn.cursor(DictCursor)  as cursor:
        await cursor.execute(sql,(email,))
        return await cursor.fetchone()