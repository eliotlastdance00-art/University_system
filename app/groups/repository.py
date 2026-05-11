
from aiomysql import Connection,DictCursor






#----------CREATE GROUPS-------------
async def create_gp(conn:Connection,name:str,department_id:int):
    sql="INSERT INTO student_group (name,department_id) VALUES (%s,%s)"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(name,department_id))
    return await conn.commit()    



#----------GET ALL GROUPS------------
async def get_all_gp(conn:Connection):
    sql="""
           SELECT g.id,
                  g.name,
                  g.department_id,
                  d.name AS department_name
                  FROM student_group g JOIN departments d on g.department_id=d.id
"""
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql)
        return await cursor.fetchall()
    


#------------GET {ID} GROUPS---------------
async def get_id_gp(conn:Connection,group_id:int):
    sql="""
           SELECT g.id,
                  g.name,
                  g.department_id,
                  d.name AS  department_name
                  FROM student_group g JOIN departments d ON g.department_id=d.id
                  WHERE g.id=%s
    """
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(group_id,))
        return await cursor.fetchone()
    

#-------------GET NAME GROUP-------------------
async def get_name_gp(conn:Connection,name:str,department_id:int):
    sql="SELECT id FROM student_group WHERE name=%s and department_id=%s"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(name,department_id))
        return await cursor.fetchone()
    


#-----------UPDATE GROUPS--------------
async def update_gp(conn:Connection,group_id:int,name:str,department_id:int):
    sql="UPDATE student_group SET name=%s , department_id=%s WHERE id=%s"
    async with conn.cursor() as cursor:
        await cursor.execute(sql,(name,department_id,group_id))
    await conn.commit()




#----------Delete Groups-------------
async def delete_gp(conn:Connection,group_id:int):
    sql="DELETE FROM student_group WHERE id=%s"
    async with conn.cursor() as cursor:
        await cursor.execute(sql,(group_id))
    await conn.commit()    


