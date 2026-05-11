#================================================
#                MySQL scriptleri
#================================================



from aiomysql import Connection,DictCursor



#--------Add Faculty--------

async def create_faculty(conn:Connection,name:str,code:str):
    sql="INSERT INTO faculties(name,code) VALUES (%s,%s)"
    async with conn.cursor() as cursor:
        await cursor.execute(sql,(name,code))
    await conn.commit()   



#--------Get all Faculty----------

async def get_all_faculty(conn:Connection):
    sql="SELECT * FROM faculties"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql)
    result=await cursor.fetchall()
    return result


#-----------Get{code}---------------

async def get_faculty_by_code(conn:Connection,code:str):
    sql="SELECT id,name,code FROM faculties WHERE code=%s"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(code,))   
        return await cursor.fetchone()
    


#-----------Get{id}---------------

async def get_faculty_by_id(conn:Connection,faculty_id:int):
    sql="SELECT id,name,code FROM faculties WHERE id=%s"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(faculty_id,))   
        return await cursor.fetchone()




#-----------Update Faculty-----------

async def update_faculty(conn:Connection,faculty_id:int,name:str,code:str):
    sql="UPDATE faculties set name=%s,code=%s where id=%s"
    async with conn.cursor() as cursor:
        await cursor.execute(sql,(name,code,faculty_id))
    await conn.commit()


#-----------Delete Faculty--------------


async def delete_faculty(conn:Connection,faculty_id:int):
    sql="DELETE FROM faculties WHERE id=%s"
    async with conn.cursor() as cursor:
        await cursor.execute(sql,(faculty_id))
    await conn.commit()    


