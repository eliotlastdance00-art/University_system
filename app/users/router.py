from typing import Annotated

from aiomysql import Connection
from fastapi import APIRouter, Depends, status

from app.core.database import get_db
from app.core.dependencies import admin_required, get_user_id

from .schemas import (
    SectionAssign,
    UserCreate,
    UserResponse,
    UserRoleCreate,
    UserSearchFilters,
    UserUpdate,
)
from .service import UserService

router = APIRouter()

CurrentUser = Annotated[dict, Depends(admin_required)]
DbConnection = Annotated[Connection, Depends(get_db)]


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user",
    description="Register a new user. Email must be unique and password at least 8 characters.",
)
async def create_user(data: UserCreate, conn: DbConnection) -> UserResponse:
    service = UserService(conn)
    # current_user ýok - açyk registrasiýa endpoint, actor_id=None bolup galýar
    return await service.user_create(data)


@router.get(
    "/",
    response_model=list[UserResponse],
    summary="Get all users",
    description="Retrieve a list of all registered users in the system.",
)
async def get_all_users(
    current_user: CurrentUser, conn: DbConnection
) -> list[UserResponse]:
    service = UserService(conn)
    return await service.get_all()


@router.get("/search")
async def search_users(
    current_user: CurrentUser,
    conn: DbConnection,
    filters: UserSearchFilters = Depends(),  # Ruff (B008)
) -> list[UserResponse]:
    service = UserService(conn)
    return await service.search_users(filters)


@router.get(
    "/{id}",
    response_model=UserResponse,
    summary="Get user by ID",
    description="Fetch details of a specific user using their unique ID.",
)
async def get_user(
    id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> UserResponse:
    service = UserService(conn)
    return await service.get_user_by_id(id)


@router.patch(
    "/{id}",
    response_model=dict,
    summary="Update user",
    description="Partially update user fields. Omitted fields keep their current value.",
)
async def update_user(
    id: int,
    data: UserUpdate,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = UserService(conn)
    return await service.update_user(id, data, actor_id=get_user_id(current_user))


@router.delete(
    "/{id}",
    response_model=dict,
    summary="Delete user",
    description="Permanently remove a user account from the database.",
)
async def delete_user(
    id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = UserService(conn)
    return await service.delete_user(id, actor_id=get_user_id(current_user))


@router.post(
    "/{user_id}/roles",
    response_model=dict,
    summary="Assign role to user",
    description="Assign a specific role and link academic structural IDs (faculty, department, section).",
)
async def post_role(
    user_id: int,
    data: UserRoleCreate,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = UserService(conn)
    return await service.give_role(
        user_id=user_id,
        role_id=data.role_id,
        faculty_id=data.faculty_id,
        department_id=data.department_id,
        section_id=data.section_id,
        actor_id=get_user_id(current_user),
    )


@router.get(
    "/{user_id}/roles",
    response_model=list,
    summary="Get user roles",
    description="List all organizational and academic roles assigned to the specified user.",
)
async def get_role(
    user_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> list:
    service = UserService(conn)
    return await service.show_roles(user_id)


@router.delete(
    "/{user_id}/roles/{role_id}",
    response_model=dict,
    summary="Remove role from user",
    description="Revoke an assigned role from a user using path parameters.",
)
async def delete_role(
    user_id: int,
    role_id: int,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = UserService(conn)
    return await service.delete_role(user_id, role_id, actor_id=get_user_id(current_user))


@router.post(
    "/{user_id}/assign-section",
    response_model=dict,
    summary="Assign user to section",
    description="Assign a student user to an academic section, subject to capacity limits.",
)
async def assign_section(
    user_id: int,
    data: SectionAssign,
    current_user: CurrentUser,
    conn: DbConnection,
) -> dict:
    service = UserService(conn)
    return await service.assign_section(
        user_id, data.section_id, actor_id=get_user_id(current_user)
    )
