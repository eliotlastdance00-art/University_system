import aiomysql


class DeviceTokenRepository:
    """device_tokens table bilen bagly SQL. Connection router->service->repo arkaly geçirilýär."""

    def __init__(self, conn: aiomysql.Connection):
        self._conn = conn

    async def deactivate_token(self, token: str) -> None:
        """FCM-e iberilende ýalňyşlyk (FirebaseError) berýän token-i öçürýär (is_active=FALSE)."""
        query = "UPDATE device_tokens SET is_active = FALSE WHERE token = %s"
        async with self._conn.cursor() as cur:
            await cur.execute(query, (token,))

    async def upsert_token(self, user_id: int, token: str, device_type: str) -> None:
        query = """
            INSERT INTO device_tokens (user_id, token, device_type, is_active)
            VALUES (%s, %s, %s, TRUE)
            ON DUPLICATE KEY UPDATE
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
        """
        async with self._conn.cursor() as cur:
            await cur.execute(query, (user_id, token, device_type))

    async def get_tokens_for_users(self, user_ids: list[int]) -> list[tuple[int, str]]:
        """Islendik audience-den soň çykan user_id list-i üçin (user_id, token) jübütlerini getirýär."""
        if not user_ids:
            return []
        placeholders = ",".join(["%s"] * len(user_ids))
        query = f"""
            SELECT user_id, token FROM device_tokens
            WHERE user_id IN ({placeholders}) AND is_active = TRUE
        """
        async with self._conn.cursor() as cur:
            await cur.execute(query, tuple(user_ids))
            rows = await cur.fetchall()
            return [(row[0], row[1]) for row in rows]


class AudienceRepository:
    """
    'Kime iberilmeli' — user_profiles + user_roles + subject_assignments
    esasynda audience (user_id list) çykarýan sorag-lar.
    Bu ýerde authorization YOK — diňe filter kesgitlenen boýunça user tapýar.
    Scope-enforcement (kimiň nämä hukugy bar) service.py-de bolar.
    """

    def __init__(self, conn: aiomysql.Connection):
        self._conn = conn

    async def get_role_level(self, role_name: str) -> int | None:
        """Berlen rol adynyň level-ini getirýär (roles.level). Tapylmasa None."""
        query = "SELECT level FROM roles WHERE name = %s"
        async with self._conn.cursor() as cur:
            await cur.execute(query, (role_name,))
            row = await cur.fetchone()
            return row[0] if row else None

    async def get_user_ids_in_sections(self, section_ids: list[int]) -> list[int]:
        """Berlen section_id-leriň içindäki studentleriň user_id-lerini getirýär."""
        if not section_ids:
            return []
        placeholders = ",".join(["%s"] * len(section_ids))
        query = f"""
            SELECT DISTINCT up.user_id
            FROM user_profiles up
            JOIN user_roles ur ON ur.user_id = up.user_id
            JOIN roles r ON r.id = ur.role_id
            WHERE r.name = 'student' AND up.section_id IN ({placeholders})
        """
        async with self._conn.cursor() as cur:
            await cur.execute(query, tuple(section_ids))
            rows = await cur.fetchall()
            return [row[0] for row in rows]

    async def get_user_ids(
        self,
        role_name: str | None = None,
        faculty_id: int | None = None,
        department_id: int | None = None,
        section_id: int | None = None,
        academic_year_id: int | None = None,
    ) -> list[int]:
        """
        Berlen kriteriýalaryň hemmesini AND bilen birleşdirýär.
        None bolan meýdan — 'hemmesi' diýmek, WHERE-e goşulmaýar.
        """
        conditions = ["1 = 1"]
        params: list = []

        query = """
            SELECT DISTINCT up.user_id
            FROM user_profiles up
        """

        if role_name is not None:
            query += """
                JOIN user_roles ur ON ur.user_id = up.user_id
                JOIN roles r ON r.id = ur.role_id
            """
            conditions.append("r.name = %s")
            params.append(role_name)

        if academic_year_id is not None:
            query += " JOIN cohorts c ON c.id = up.cohort_id"
            conditions.append("c.academic_year_id = %s")
            params.append(academic_year_id)

        if faculty_id is not None:
            conditions.append("up.faculty_id = %s")
            params.append(faculty_id)

        if department_id is not None:
            conditions.append("up.department_id = %s")
            params.append(department_id)

        if section_id is not None:
            conditions.append("up.section_id = %s")
            params.append(section_id)

        query += " WHERE " + " AND ".join(conditions)

        async with self._conn.cursor() as cur:
            await cur.execute(query, tuple(params))
            rows = await cur.fetchall()
            return [row[0] for row in rows]

    async def get_teacher_section_ids(self, teacher_user_id: int) -> list[int]:
        """Mugallymyň sapak berýän section-larynyň ID-leri (subject_assignments arkaly)."""
        query = """
            SELECT DISTINCT section_id FROM subject_assignments
            WHERE user_id = %s AND section_id IS NOT NULL
        """
        async with self._conn.cursor() as cur:
            await cur.execute(query, (teacher_user_id,))
            rows = await cur.fetchall()
            return [row[0] for row in rows]

    async def get_sender_scope(self, sender_user_id: int) -> dict:
        """
        Iberijiniň öz rolyny (level bilen) we scope-a degişli ID-lerini getirýär.
        service.py bu maglumaty audience-i mejbury çäklendirmek üçin ulanýar.
        """
        query = """
            SELECT r.name AS role_name, r.level AS role_level,
                    up.faculty_id, up.department_id, up.section_id
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            LEFT JOIN user_profiles up ON up.user_id = ur.user_id
            WHERE ur.user_id = %s
            ORDER BY r.level ASC
            LIMIT 1
        """
        async with self._conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, (sender_user_id,))
            return await cur.fetchone()


class NotificationLogRepository:
    def __init__(self, conn: aiomysql.Connection):
        self._conn = conn

    async def bulk_create(self, entries: list[tuple[int, int, str, str, str]]) -> None:
        query = """
            INSERT INTO notification_log (sender_id, receiver_id, title, body, status)
            VALUES (%s, %s, %s, %s, %s)
        """
        async with self._conn.cursor() as cur:
            await cur.executemany(query, entries)

    async def get_by_receiver(
        self, receiver_id: int, limit: int = 20, offset: int = 0
    ) -> list[dict]:
        query = """
            SELECT id, sender_id, title, body, status, is_read, created_at
            FROM notification_log
            WHERE receiver_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        async with self._conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, (receiver_id, limit, offset))
            return await cur.fetchall()

    async def mark_as_read(self, notification_id: int, receiver_id: int) -> bool:
        query = """
            UPDATE notification_log SET is_read = TRUE
            WHERE id = %s AND receiver_id = %s
        """
        async with self._conn.cursor() as cur:
            affected = await cur.execute(query, (notification_id, receiver_id))
            return affected > 0
