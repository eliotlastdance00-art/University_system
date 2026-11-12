-- ═══════════════════════════════════════════════════════════════
-- QR Attendance System — Database Migration
-- ═══════════════════════════════════════════════════════════════
-- Bu migration-y MySQL-de run ediň:
--   mysql -u root -p university_system < migration.sql
-- ═══════════════════════════════════════════════════════════════


-- ─── QR Session tablisasy ──────────────────────────────────────
-- Mugallym sapak başlanda bir session açýar.
-- Her session-yň bir wagtda diňe bir aktiw token-i bolýar.

CREATE TABLE IF NOT EXISTS qr_sessions (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id        INT NOT NULL,
    teacher_id       INT NOT NULL,

    -- Session ýagdaýy: diňe 1 lesson-da 1 active session bolup biler
    status           ENUM('active', 'closed') NOT NULL DEFAULT 'active',

    -- Häzirki aktiw token (her ~30s täzelenýär)
    current_token    VARCHAR(64)  NOT NULL,
    token_expires_at DATETIME     NOT NULL,

    -- Session wagty
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at        DATETIME     NULL,

    -- Daşary açarlar
    FOREIGN KEY (lesson_id)  REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id)   ON DELETE CASCADE,

    -- Bir lesson-da diňe bir active session bolup biler.
    -- closed session-lar çäklendirilmeýär.
    -- MySQL-de partial unique index ýok, şonuň üçin application-level-de barlaýarys.
    INDEX idx_qr_sessions_lesson_status (lesson_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── QR Attendance Log tablisasy ───────────────────────────────
-- Studentleriň QR skan eden ýazgylary. Anti-cheat metadata saklanýar.

CREATE TABLE IF NOT EXISTS qr_attendance_logs (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    session_id       INT NOT NULL,
    student_id       INT NOT NULL,

    -- Audit / anti-cheat metadata
    scanned_token    VARCHAR(64)  NOT NULL,
    device_hash      VARCHAR(128) NULL,
    ip_address       VARCHAR(45)  NULL,
    scanned_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Daşary açarlar
    FOREIGN KEY (session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id)       ON DELETE CASCADE,

    -- Bir student bir session-da diňe 1 gezek bellenip bilýär
    UNIQUE KEY uq_student_session (session_id, student_id),

    INDEX idx_qr_logs_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
