-- ============================================================================
-- Migration: 005_lessons_attendance_and_qr.sql
-- Target:    MySQL 8.0+ (InnoDB, utf8mb4_unicode_ci)
-- Purpose:   Concrete lesson occurrences, manual attendance, and QR attendance.
-- Tables:    lessons, attendance, qr_sessions, qr_attendance_logs
-- Depends:   001_identity_and_auth.sql, 004_timetable_and_scheduling.sql
-- Fixes:
--   - Adds missing `lessons.note` column (required by all /lessons queries).
--   - Aligns `lessons.status` ENUM('scheduled', 'completed', 'cancelled')
--     DEFAULT 'completed' with `LessonRepository` and `LessonStatusEnum`.
--   - Adds DB-level UNIQUE (timetable_id, date) on `lessons`.
--   - Consolidates `qr_sessions` and `qr_attendance_logs` into the central
--     migration sequence (was stranded in `app/academic/attendance/migration.sql`).
--   - Uses a MySQL 8.0 VIRTUAL generated column (`active_lesson_id`) + UNIQUE
--     key on `qr_sessions` to enforce at most 1 active QR session per lesson
--     atomically at the database level.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

-- 1. Concrete lesson instances derived from timetable slots
CREATE TABLE IF NOT EXISTS lessons (
    id            INT      NOT NULL AUTO_INCREMENT,
    timetable_id  INT      NOT NULL,
    date          DATE     NOT NULL,
    status        ENUM('scheduled', 'completed', 'cancelled')
                           NOT NULL DEFAULT 'completed',
    note          TEXT     NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_lessons_timetable_date UNIQUE (timetable_id, date),
    INDEX idx_lessons_date (date),
    INDEX idx_lessons_status (status),
    CONSTRAINT fk_lessons_timetable
        FOREIGN KEY (timetable_id) REFERENCES timetable (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Per-lesson student attendance records
CREATE TABLE IF NOT EXISTS attendance (
    id          INT      NOT NULL AUTO_INCREMENT,
    lesson_id   INT      NOT NULL,
    user_id     INT      NOT NULL COMMENT 'Student user ID',
    status      ENUM('present', 'absent', 'late', 'excused')
                         NOT NULL,
    marked_by   INT      NULL DEFAULT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_attendance_lesson_user UNIQUE (lesson_id, user_id),
    INDEX idx_attendance_user_id (user_id),
    INDEX idx_attendance_status (status),
    INDEX idx_attendance_marked_by (marked_by),
    CONSTRAINT fk_attendance_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_marked_by
        FOREIGN KEY (marked_by) REFERENCES users (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Rotating-token QR attendance sessions
-- Note: `fk_qr_sessions_lesson` uses default ON UPDATE RESTRICT because
-- MySQL 8.0 forbids ON UPDATE CASCADE on base columns of generated columns.
CREATE TABLE IF NOT EXISTS qr_sessions (
    id                INT         NOT NULL AUTO_INCREMENT,
    lesson_id         INT         NOT NULL,
    teacher_id        INT         NOT NULL,
    status            ENUM('active', 'closed')
                                  NOT NULL DEFAULT 'active',
    current_token     VARCHAR(64) NOT NULL,
    token_expires_at  DATETIME    NOT NULL,
    created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at         DATETIME    NULL DEFAULT NULL,
    active_lesson_id  INT GENERATED ALWAYS AS (
                          CASE WHEN status = 'active' THEN lesson_id ELSE NULL END
                      ) VIRTUAL,
    PRIMARY KEY (id),
    CONSTRAINT uq_qr_sessions_active_lesson UNIQUE (active_lesson_id),
    INDEX idx_qr_sessions_lesson_status (lesson_id, status),
    INDEX idx_qr_sessions_teacher_id (teacher_id),
    CONSTRAINT fk_qr_sessions_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_qr_sessions_teacher
        FOREIGN KEY (teacher_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Student QR scan logs with anti-cheat metadata
CREATE TABLE IF NOT EXISTS qr_attendance_logs (
    id             INT          NOT NULL AUTO_INCREMENT,
    session_id     INT          NOT NULL,
    student_id     INT          NOT NULL,
    scanned_token  VARCHAR(64)  NOT NULL,
    device_hash    VARCHAR(128) NULL DEFAULT NULL,
    ip_address     VARCHAR(45)  NULL DEFAULT NULL,
    scanned_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_qr_attendance_logs_session_student
        UNIQUE (session_id, student_id),
    INDEX idx_qr_attendance_logs_session_scanned (session_id, scanned_at),
    INDEX idx_qr_attendance_logs_student_id (student_id),
    CONSTRAINT fk_qr_attendance_logs_session
        FOREIGN KEY (session_id) REFERENCES qr_sessions (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_qr_attendance_logs_student
        FOREIGN KEY (student_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version, name)
VALUES ('005', 'lessons_attendance_and_qr');
