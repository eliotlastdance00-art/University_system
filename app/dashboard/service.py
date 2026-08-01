from aiomysql import Connection

from app.dashboard import repository as repo


class DashboardService:
    def __init__(self, conn: Connection):
        self.conn = conn

    async def get_base_dashboard(self, user_id: int, role: str) -> dict:
        notifications = await repo.get_recent_notifications(self.conn, user_id)
        unread_count = await repo.get_unread_notification_count(self.conn, user_id)

        return {
            "role": role,
            "notifications": notifications,
            "unread_notification_count": unread_count,
        }

    async def get_admin_dashboard(self, user_id: int, role: str) -> dict:
        """Fetch all real statistics for the admin dashboard."""
        base_data = await self.get_base_dashboard(user_id, role)

        # Counts
        total_users = await repo.get_total_users(self.conn)
        total_students = await repo.get_total_students(self.conn)
        total_teachers = await repo.get_total_teachers(self.conn)
        total_faculties = await repo.get_total_faculties(self.conn)
        total_departments = await repo.get_total_departments(self.conn)
        total_sections = await repo.get_total_sections(self.conn)
        total_subjects = await repo.get_total_subjects(self.conn)

        # Rich data
        active_year = await repo.get_active_academic_year(self.conn)
        role_dist = await repo.get_role_distribution(self.conn)
        recent_logs = await repo.get_recent_audit_logs(self.conn, limit=10)
        today_lessons = await repo.get_today_lessons_count(self.conn)
        attendance_rate = await repo.get_overall_attendance_rate(self.conn)

        return {
            **base_data,
            "total_users": total_users,
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_faculties": total_faculties,
            "total_departments": total_departments,
            "total_sections": total_sections,
            "total_subjects": total_subjects,
            "active_academic_year": active_year,
            "role_distribution": role_dist,
            "recent_activity": recent_logs,
            "today_lessons_count": today_lessons,
            "overall_attendance_rate": attendance_rate,
        }

    async def get_recent_audit_logs(self, limit: int = 10) -> list[dict]:
        """Fetch just the recent audit logs (used for live ticker)."""
        return await repo.get_recent_audit_logs(self.conn, limit=limit)
