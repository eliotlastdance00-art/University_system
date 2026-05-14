
from fastapi import APIRouter, Depends
from aiomysql import Connection
from . import service
from .schemas import UserCreate, UserUpdate, UserResponse,UserRoleCreate
from app.core.database import get_db
from app.core.dependencies import admin_required

router = APIRouter()


# ╔══════════════════════════════════════╗
# ║         USER DÖRETMEK                ║
# ║  POST /users                         ║
# ╚══════════════════════════════════════╝
@router.post("/", response_model=UserResponse)
async def create_user(
    data: UserCreate,
    conn: Connection = Depends(get_db)
):
    return await service.user_create(conn, data)


# ╔══════════════════════════════════════╗
# ║         ÄHLI USERLERI GETIR          ║
# ║  GET /users                          ║
# ╚══════════════════════════════════════╝
@router.get("/", response_model=list[UserResponse])
async def get_all_users(
    conn: Connection = Depends(get_db)
):
    return await service.get_all(conn)


# ╔══════════════════════════════════════╗
# ║         ID BOÝUNÇA GETIR             ║
# ║  GET /users/{user_id}                ║
# ╚══════════════════════════════════════╝
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    conn: Connection = Depends(get_db)
):
    return await service.get_user_by_id(conn, user_id)


# ╔══════════════════════════════════════╗
# ║         USER ÜÝTGETMEK               ║
# ║  PUT /users/{user_id}                ║
# ╚══════════════════════════════════════╝
@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: int,
    data: UserUpdate,
    conn: Connection = Depends(get_db)
):
    return await service.update_user(conn, user_id, data)


# ╔══════════════════════════════════════╗
# ║         USER POZMAK                  ║
# ║  DELETE /users/{user_id}             ║
# ╚══════════════════════════════════════╝
@router.delete("/{user_id}", response_model=dict)
async def delete_user(
    user_id: int,
    conn: Connection = Depends(get_db)
):
    return await service.delete_user(conn, user_id)




@router.post("/{user_id}/roles")
async def post_role(
    data:UserRoleCreate,
    conn:Connection = Depends(get_db)
):
    return await service.give_role(conn,data.user_id,data.role_id,data.faculty_id,data.department_id,data.group_id)




@router.get("/{user_id}/roles")
async def get_role(user_id:int,conn:Connection=Depends(get_db)):
    return await service.show_roles(conn,user_id)



@router.delete("/{user_id}/roles/{role_id}")
async def delete_role(data:UserRoleCreate,conn:Connection=Depends(get_db)):
    return await service.delete_role(conn,data.user_id,data.role_id)