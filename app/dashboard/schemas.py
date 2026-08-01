from datetime import datetime
from pydantic import BaseModel


class NotificationMinimal(BaseModel):
    id: int
    title: str
    body: str
    is_read: bool


class DashboardBaseResponse(BaseModel):
    role: str
    unread_notification_count: int
    notifications: list[NotificationMinimal]


# ─── Rich Models ────────────────────────────────────────────


class AcademicYearMinimal(BaseModel):
    id: int
    year_start: int
    year_end: int
    is_active: bool


class RoleDistribution(BaseModel):
    role: str
    count: int


class AuditLogMinimal(BaseModel):
    id: int
    action: str
    entity_name: str
    entity_id: int
    timestamp: datetime
    actor_name: str | None = None


class AdminDashboardResponse(DashboardBaseResponse):
    total_users: int
    total_faculties: int
    total_departments: int
    total_students: int
    total_teachers: int
    total_sections: int
    total_subjects: int
    active_academic_year: AcademicYearMinimal | None
    role_distribution: list[RoleDistribution]
    recent_activity: list[AuditLogMinimal]
    today_lessons_count: int
    overall_attendance_rate: float
