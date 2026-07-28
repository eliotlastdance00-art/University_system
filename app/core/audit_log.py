import json
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any


class AuditAction(StrEnum):
    """
    Setirleri elde ýazmagyň deregine Enum ulanýarys — sebäbi
    "update" / "Update" / "edit" ýaly ýalňyşlyklaryň öňüni alýar
    we soň audit_logs-y filtrlemek aňsat bolýar.
    """
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    ROLE_ASSIGN = "role_assign"
    ROLE_REVOKE = "role_revoke"
    SECTION_ASSIGN = "section_assign"
    PASSWORD_CHANGE = "password_change" 
    BROADCAST = "broadcast"


class AuditLogger:
    """
    Ulgamdaky üýtgeşmeleri (kim, näme, haçan, öňki/täze ýagdaý)
    audit_logs tablisasyna ýazýar.
    """

    def __init__(self, conn):
        self.conn = conn

    async def log(
        self,
        actor_id: int | None,
        action: AuditAction,
        entity_name: str,
        entity_id: int | None,
        old_value: dict[str, Any] | None = None,
        new_value: dict[str, Any] | None = None,
    ) -> None:
        await self.conn.execute(
            """
            INSERT INTO audit_logs
                (actor_id, action, entity_name, entity_id, old_value, new_value, timestamp)
            VALUES
                (:actor_id, :action, :entity_name, :entity_id, :old_value, :new_value, :timestamp)
            """,
            {
                "actor_id": actor_id,
                "action": action.value,
                "entity_name": entity_name,
                "entity_id": entity_id,
                "old_value": json.dumps(old_value, default=str) if old_value is not None else None,
                "new_value": json.dumps(new_value, default=str) if new_value is not None else None,
                "timestamp": datetime.now(UTC),
            },
        )