from .schemas import GroupCreate, GroupResponse, GroupUpdate
from fastapi import HTTPException
from . import repository
from app.department import repository as dp_repository




#            POST GROUP


async def create_group(conn, data: GroupCreate):
    department = await dp_repository.get_department_by_id(conn, data.department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Not found this department")
    existing = await repository.get_name_gp(conn, data.name, data.department_id)
    if existing:
        raise HTTPException(status_code=400, detail="That group already awaiable")
    await repository.create_gp(conn, data.name, data.department_id)
    return {"message": "Succesfully created group"}


#           GET GROUP


async def get_all_group(conn):
    groups = await repository.get_all_gp(conn)
    return [GroupResponse(**g) for g in groups]


#          GET BY ID GROUP


async def get_by_id_group(conn, group_id: int):
    group = await repository.get_id_gp(conn, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Not found that group")
    return GroupResponse(**group)


#          PUT GROUP


async def update_group(conn, group_id: int, data: GroupUpdate):
    department = await dp_repository.get_department_by_id(conn, data.department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Not found this department")
    group = await repository.get_id_gp(conn, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Not found that group")
    new_name = data.name if data.name else group["name"]
    new_department_id = (
        data.department_id if data.department_id else group["department_id"]
    )
    await repository.update_gp(conn, group_id, new_name, new_department_id)
    return {"message": "Succesfully updated group"}


#          DELETE GROUP
async def delete_group(conn, group_id: int):
    group = await repository.get_id_gp(conn, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Not found group")
    await repository.delete_gp(conn, group_id)
    return {"message": "Delete group"}
