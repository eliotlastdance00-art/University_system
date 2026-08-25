"""
QR Attendance Schemas — Pydantic request / response model-lar.
"""

from datetime import datetime

from pydantic import BaseModel


# ─── SESSION START Response ──────────────────────────────────


class QrSessionStartResponse(BaseModel):
    """Mugallym session açanda gaýdyp gelýän jogap."""

    session_id: int
    qr_data: str          # Base64-encoded QR payload
    expires_in: int       # Token-yň galan ömri (sekunt)
    message: str = "QR session üstünlikli açyldy"


# ─── SESSION REFRESH Response ────────────────────────────────


class QrSessionRefreshResponse(BaseModel):
    """Token täzelenende gaýdyp gelýän jogap (frontend her 25-30s çagyrýar)."""

    qr_data: str          # Täze Base64-encoded QR payload
    expires_in: int       # Token-yň galan ömri (sekunt)
    present_count: int    # Häzire çenli scan eden student sany


# ─── SESSION CLOSE Response ──────────────────────────────────


class QrSessionCloseResponse(BaseModel):
    """Session ýapylanda gaýdyp gelýän jogap."""

    session_id: int
    present_count: int
    absent_count: int
    message: str = "Session ýapyldy, attendance bellendi"


# ─── LIVE SCAN Response ─────────────────────────────────────


class QrLiveScanItem(BaseModel):
    """Bir studentiň scan ýazgysy (live view üçin)."""

    student_id: int
    student_name: str
    scanned_at: datetime


# ─── STUDENT VERIFY Request / Response ───────────────────────


class QrVerifyRequest(BaseModel):
    """Student QR skan edenden soň ugradýan request-i."""

    session_id: int
    token: str


class QrVerifyResponse(BaseModel):
    """Verify endpoint-yň jogaby."""

    status: str           # "present"
    student_name: str
    message: str
