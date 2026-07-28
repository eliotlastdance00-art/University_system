import repository as repo
from aiomysql import Connection


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
