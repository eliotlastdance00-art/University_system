import os
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import settings


def _build_message(to_email: str, otp: str) -> MIMEMultipart:
    """
    Email gurluşyny döredýär (HTML + plain text)
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Email verification code"
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    plain = MIMEText(
        f"Your OTP code is: {otp}\n"
        f"This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.",
        "plain",
    )
    template_path = os.path.join(os.path.dirname(__file__), "template", "verify.html")

    with open(template_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    html_content = html_content.replace("{{ otp }}", otp)
    html_content = html_content.replace(
        "{{ expire_minutes }}", str(settings.OTP_EXPIRE_MINUTES)
    )

    html = MIMEText(html_content, "html")
    msg.attach(plain)
    msg.attach(html)
    return msg


async def send_otp_email(to_email: str, otp: str) -> None:
    message = _build_message(to_email, otp)
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE

    use_tls = settings.SMTP_PORT == 465
    start_tls = settings.SMTP_PORT == 587

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASS,
        use_tls=use_tls,
        start_tls=start_tls,
        tls_context=context,
        timeout=5.0,
    )
