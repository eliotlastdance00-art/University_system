from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ─── Database ───────────────────────────────────────────
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    # ─── JWT / Auth ─────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    # ─── SMTP / Email ───────────────────────────────────────
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASS: str
    SMTP_TLS: bool = True
    OTP_EXPIRE_MINUTES: int

    # ─── Firebase (optional — gracefully skipped if absent) ─
    FIREBASE_CREDENTIALS_PATH: str | None = None

    # ─── Application ────────────────────────────────────────
    APP_NAME: str = "University System"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()  # pyright: ignore[reportCallIssue]
