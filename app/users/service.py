from . import repository
from fastapi import HTTPException
from .schemas import UserCreate,UserResponse,UserUpdate



# ╔══════════════════════════════════════╗
# ║         USER DÖRETMEK                ║
# ║  Email barmy? → 400                  ║
# ║  Ýok → döret → response gaýtar       ║
# ╚══════════════════════════════════════╝
async def user_create(conn,data:UserCreate):
    user= await repository.get_by_email_users(conn,data.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="That email already created"
        )
    if not data.password:
        raise HTTPException(
            status_code=400,
            detail="Password is too short! It must be at least 8 characters long."
        )
    await repository.create_user(conn, data.full_name,data.email,data.password)
    user= await repository.get_by_email_users(conn,data.email)
    return UserResponse(**user)




# ╔══════════════════════════════════════╗
# ║         ÄHLI USERLERI GETIR          ║
# ║  Barlag ýok → ählisini gaýtar        ║
# ╚══════════════════════════════════════╝
async def get_all(conn):
    users=await repository.get_all_users(conn)
    return [UserResponse(**u) for u in users]





# ╔══════════════════════════════════════╗
# ║         ID BOÝUNÇA GETIR             ║
# ║  Ýok → 404                           ║
# ║  Bar → response gaýtar               ║
# ╚══════════════════════════════════════╝
async def get_user_by_id(conn, user_id: int):
    user = await repository.get_by_id_users(conn, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Not found user")
    return UserResponse(**user)


# ╔══════════════════════════════════════╗
# ║         USER UPDATE.                 ║
# ║  Ýok → 404                           ║
# ║  Iberilmedik → eskisi galýar         ║
# ╚══════════════════════════════════════╝
async def update_user(conn, user_id: int, data: UserUpdate):
    user = await repository.get_by_id_users(conn, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Not found user")
    new_full_name = data.full_name if data.full_name else user["full_name"]
    new_email     = data.email     if data.email     else user["email"]
    new_password  = data.password  if data.password  else user["password"]
    new_is_active = data.is_active if data.is_active is not None else user["is_active"]
    await repository.update_user(conn, user_id, new_full_name, new_email, new_password, new_is_active)
    return {"message": "Changed user ✅"}


# ╔══════════════════════════════════════╗
# ║         USER POZMAK                  ║
# ║  Ýok → 404                           ║
# ║  Bar → poz                           ║
# ╚══════════════════════════════════════╝
async def delete_user(conn, user_id: int):
    user = await repository.get_user_by_id(conn, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Not found user")
    await repository.delete_user(conn, user_id)
    return {"message": "Delete user ✅"}




# ╔══════════════════════════════════════╗
# ║           Rol bermek                 ║
# ║  Ýok → 404                           ║
# ║  Bar → poz                           ║
# ╚══════════════════════════════════════╝


async def give_role(conn,user_id:int,role_id:int,faculty_id:int=None,department_id:int=None,group_id:int=None):
    user= await repository.get_by_id_users(conn,user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Not found user"
        )
    role= await repository.role_by_id(conn,role_id)
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Not found ROlE"
        )
    existing_role= await repository.get_user_role(conn,user_id,role_id)
    if existing_role:
        raise HTTPException(
            status_code=400,
            detail="Role already taken"

        )
    await repository.assign_role(conn,user_id,role_id)
    await repository.assign_profile(conn,user_id,faculty_id,department_id,group_id)
    return {"message":"Succesfully given role"}
    



# ╔══════════════════════════════════════╗
# ║           Rollary gormek             ║
# ║  Ýok → 404                           ║
# ║  Bar → poz                           ║
# ╚══════════════════════════════════════╝

async def show_roles(conn,user_id:int):
    user= await repository.get_by_id_users(conn,user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="not found user"
        )
    return await repository.get_user_roles_all(conn,user_id)


# ╔══════════════════════════════════════╗
# ║           Remove Role.               ║
# ║  Ýok → 404                           ║
# ║  Bar → poz                           ║
# ╚══════════════════════════════════════╝

async def delete_role(conn,user_id:int,role_id:int):
    user= await repository.get_by_id_users(conn,user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="not found user"
        )
    existing_role= await repository.get_user_role(conn,user_id,role_id)
    if   existing_role:
        raise HTTPException(
            status_code=400,
            detail="Role bar"

        )
    return await repository.remove_role(conn,user_id,role_id)


