from fastapi import APIRouter, Depends
from . import service
from aiomysql import Connection
from .schemas import GroupCreate, GroupResponse, GroupUpdate
from app.core.database import get_db

router = APIRouter()


@router.post("/", response_model=dict)
async def post_group(
    data: GroupCreate,
    conn: Connection = Depends(get_db),
):
    return await service.create_group(conn, data)


@router.put("/{group_id}", response_model=dict)
async def put_group(
    group_id: int, data: GroupUpdate, conn: Connection = Depends(get_db)
):
    return await service.update_group(conn, group_id, data)


@router.get("/", response_model=list[GroupResponse])
async def get_group(conn: Connection = Depends(get_db)):
    return await service.get_all_group(conn)


@router.get("/{group_id}", response_model=GroupResponse)
async def get_id(group_id: int, conn: Connection = Depends(get_db)):
    return await service.get_by_id_group(conn, group_id)


@router.delete("/{group_id}", response_model=dict)
async def delete_id(group_id: int, conn: Connection = Depends(get_db)):
    return await service.delete_group(conn, group_id)
