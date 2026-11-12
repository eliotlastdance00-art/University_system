"""
QR Token Manager — token generasiýa we QR payload encode/decode.

Her token 32-byte (256-bit) kriptografik howpsuz random hex string.
QR payload = Base64-encoded JSON { sid, tkn, ts }.
"""

import base64
import hashlib
import json
import secrets
from datetime import datetime, timedelta, timezone

# Token her näçe sekuntda täzelenýär
TOKEN_LIFETIME_SECONDS = 30


def generate_token() -> str:
    """32-byte kriptografik howpsuz random hex token döredýär."""
    return secrets.token_hex(32)


def token_expiry() -> datetime:
    """Häzirki wagtdan TOKEN_LIFETIME_SECONDS soňra gutarýan wagt."""
    return datetime.now(timezone.utc) + timedelta(seconds=TOKEN_LIFETIME_SECONDS)


def build_qr_payload(session_id: int, token: str) -> str:
    """QR-koda ýerleşdiriljek Base64-encoded JSON string döredýär.

    QR payload-y gysga saklamak üçin gysgaldylan açar atlaryny ulanýarys:
      sid = session_id
      tkn = token
      ts  = unix timestamp
    """
    payload = {
        "sid": session_id,
        "tkn": token,
        "ts": int(datetime.now(timezone.utc).timestamp()),
    }
    json_bytes = json.dumps(payload, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(json_bytes).decode()


def parse_qr_payload(qr_data: str) -> dict | None:
    """Base64 QR string-den payload-y çykarýar.

    Returns:
        dict with keys (sid, tkn, ts) ýa-da None eger format nädogry bolsa.
    """
    try:
        json_bytes = base64.urlsafe_b64decode(qr_data.encode())
        data = json.loads(json_bytes)
        # Gerekli açarlaryň barlygyny tassykla
        if not all(k in data for k in ("sid", "tkn", "ts")):
            return None
        return data
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
        return None


def compute_device_hash(user_agent: str, ip_address: str) -> str:
    """User-Agent + IP-den SHA-256 hash döredýär (audit / anti-cheat üçin).

    Bu doly ygtybarly fingerprint däl, ýöne goşmaça gatlak hökmünde peýdaly:
    şol bir device-dan 2 dürli student scan etse, hash gabat gelýär.
    """
    raw = f"{user_agent}:{ip_address}"
    return hashlib.sha256(raw.encode()).hexdigest()
