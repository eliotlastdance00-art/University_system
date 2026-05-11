from aiomysql import Connection,DictCursor
from app.core.security import hash_password



#---------------------Create User------------------------------

async def create_user(conn:Connection,full_name:str,email:str,password:str):
    hash_pass=hash_password(password)
    sql="INSERT INTO users(full_name,email,password) VALUES (%s,%s,%s)"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(full_name,email,hash_pass))
    return await conn.commit()




#--------------------Call Users------------------------------


async def get_all_users(conn:Connection):
    sql="SELECT * FROM users"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql)
        return await cursor.fetchall()



#-----------------Call by id Users------------------

async def get_by_id_users(conn:Connection,user_id:int):
    sql="SELECT id,full_name,email,is_active FROM users WHERE id=%s"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(user_id,))
        return await cursor.fetchone()
    

#---------------Call by email users---------------


async def get_by_email_users(conn:Connection,email:str):
    sql="SELECT id,full_name,email,is_active FROM users WHERE email=%s "
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(email,))
        return await cursor.fetchone()




#--------------Update User---------------
async def update_user(conn:Connection,user_id:int,full_name:str,email:str,password:str,is_active:bool):
    hash_pass=hash_password(password)
    sql="UPDATE users SET  full_name=%s,email=%s,password=%s,is_active=%s WHERE id=%s"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(full_name,email,hash_pass,is_active,user_id))
    return await conn.commit()
    




#-------------------Delete User----------------------

async def delete_user(conn:Connection,user_id:int):
    sql="DELETE FROM users WHERE id=%s"
    async with conn.cursor() as cursor:
        await cursor.execute(sql,(user_id,))
    return conn.commit()


#--------------GET User Role----------------
async def role_by_id(conn:Connection,role_id:int):
    sql="SELECT id,name FROM roles WHERE id=%s"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(role_id,))
        return await cursor.fetchone()
    


#------------Get --------------------------
async def get_user_role(conn:Connection,user_role_id:int,role_id:int):
    sql="SELECT id,user_id,role_id FROM user_roles WHERE user_id=%s and role_id=%s" 
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(user_role_id,role_id))
        return await cursor.fetchone()
    

#-------------ASSIGN_ROLE------------------
async def assign_role(conn:Connection,user_id:int,role_id:int):
    sql="INSERT INTO user_roles(user_id,role_id) VALUES (%s,%s)"
    async with conn.cursor() as cursor:
        await cursor.execute(sql,(user_id,role_id))
    return await conn.commit()     


#------------ASSIGN PROFILE-----------
async def assign_profile(conn:Connection,user_id:int,faculty_id:int=None,department_id:int=None,group_id:int=None):
    if not faculty_id and not department_id and not group_id:
        return
    sql="INSERT INTO user_profiles(user_id,faculty_id,department_id,group_id) VALUES (%s,%s,%s,%s)"
    async with conn.cursor() as cursor:
        await cursor.execute(sql,(user_id,faculty_id,department_id,group_id))
    return await conn.commit()


#--------------GET USER_ROLES all---------------
async def get_user_roles_all(conn:Connection,user_id:int):
    sql="SELECT * FROM user_roles WHERE user_id=%s"
    async with conn.cursor(DictCursor) as cursor:
        await cursor.execute(sql,(user_id,))
        return await cursor.fetchall()
    


#----------------DELETE ROLES-----------
async def remove_role(conn:Connection,user_id:int,role_id:int):
    sql="DELETE FROM user_roles WHERE user_id=%s AND role_id=%s"
    async with conn.cursor() as cursor:
        await cursor.execute(sql,(user_id,role_id))  
        await conn.commit() 
         
         