from datetime import datetime

from pydantic import BaseModel, Field


class DeviceTokenRegisterRequest(BaseModel):
    token: str
    device_type: str = Field(pattern="^(android|ios|web)$")


class BroadcastRequest(BaseModel):
    title: str
    body: str
    target_role: str | None = (
        None  # None = admin/rector üçin "hemmesi" manysyna gelip biler
    )


class NotificationOut(BaseModel):
    id: int
    sender_id: int
    title: str
    body: str
    status: str
    is_read: bool
    created_at: datetime


class BroadcastResponse(BaseModel):
    sent_count: int
