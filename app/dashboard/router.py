from aiomysql import Connection
from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.core.dependencies import admin_or_dean
from app.dashboard.schemas import AdminDashboardResponse
from app.dashboard.service import DashboardService

router = APIRouter()


@router.get("/", response_model=AdminDashboardResponse)
async def get_dashboard(
    current_user: dict = Depends(admin_or_dean), conn: Connection = Depends(get_db)
):
    service = DashboardService(conn)
    data = await service.get_admin_dashboard(get_user_id(current_user), current_user["role"])
    return AdminDashboardResponse(**data)


@router.get("/audit-logs", response_model=list[dict])
async def get_dashboard_audit_logs(
    limit: int = 10,
    current_user: dict = Depends(admin_or_dean),
    conn: Connection = Depends(get_db),
):
    service = DashboardService(conn)
    return await service.get_recent_audit_logs(limit)
