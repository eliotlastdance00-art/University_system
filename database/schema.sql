-- ============================================================================
-- University System — Canonical Schema Snapshot (MySQL 8.0+)
--
-- Single-file combined snapshot equivalent to running:
--   database/migrations/000_schema_migrations.sql
--   database/migrations/001_identity_and_auth.sql
--   database/migrations/002_academic_structure.sql
--   database/migrations/003_curriculum_and_assignments.sql
--   database/migrations/004_timetable_and_scheduling.sql
--   database/migrations/005_lessons_attendance_and_qr.sql
--   database/migrations/006_grades_notifications_and_audit.sql
--
-- Preferred deployment method: apply numbered files in `database/migrations/`
-- in ascending order (`000` -> `006`). Keep this file in sync as a reference
-- or for `/docker-entrypoint-initdb.d` fresh-container bootstrap.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

-- ─── 000: Migration Tracking ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schema_migrations (
    version     VARCHAR(20)  NOT NULL,
    name        VARCHAR(150) NOT NULL,
    applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 001: Identity & Auth ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id          INT          NOT NULL AUTO_INCREMENT,
    full_name   VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_full_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
    id          INT               NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)       NOT NULL,
    level       SMALLINT UNSIGNED NOT NULL,
    created_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_roles_name UNIQUE (name),
    CONSTRAINT chk_roles_level_positive CHECK (level > 0),
    INDEX idx_roles_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
    id          INT      NOT NULL AUTO_INCREMENT,
    user_id     INT      NOT NULL,
    role_id     INT      NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id),
    INDEX idx_user_roles_role_id (role_id),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          INT          NOT NULL AUTO_INCREMENT,
    user_id     INT          NOT NULL,
    token       VARCHAR(512) NOT NULL,
    is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at  DATETIME     NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_refresh_tokens_token UNIQUE (token),
    INDEX idx_refresh_tokens_user_revoked (user_id, is_revoked),
    INDEX idx_refresh_tokens_expires_at (expires_at),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 002: Academic Structure ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS faculties (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150) NOT NULL,
    code        VARCHAR(20)  NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_faculties_name UNIQUE (name),
    CONSTRAINT uq_faculties_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150) NOT NULL,
    faculty_id  INT          NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_departments_name UNIQUE (name),
    INDEX idx_departments_faculty_id (faculty_id),
    CONSTRAINT fk_departments_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS academic_years (
    id          INT      NOT NULL AUTO_INCREMENT,
    year_start  INT      NOT NULL,
    year_end    INT      NOT NULL,
    is_active   BOOLEAN  NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_academic_years_range UNIQUE (year_start, year_end),
    CONSTRAINT chk_academic_years_range CHECK (year_start < year_end),
    INDEX idx_academic_years_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS programs (
    id             INT          NOT NULL AUTO_INCREMENT,
    name           VARCHAR(150) NOT NULL,
    code           VARCHAR(30)  NOT NULL,
    department_id  INT          NOT NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_programs_name UNIQUE (name),
    CONSTRAINT uq_programs_code UNIQUE (code),
    INDEX idx_programs_department_id (department_id),
    CONSTRAINT fk_programs_department
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cohorts (
    id                INT          NOT NULL AUTO_INCREMENT,
    name              VARCHAR(100) NULL DEFAULT NULL,
    program_id        INT          NOT NULL,
    academic_year_id  INT          NOT NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_cohorts_program_year UNIQUE (program_id, academic_year_id),
    INDEX idx_cohorts_academic_year_id (academic_year_id),
    INDEX idx_cohorts_name (name),
    CONSTRAINT fk_cohorts_program
        FOREIGN KEY (program_id) REFERENCES programs (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cohorts_academic_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sections (
    id          INT      NOT NULL AUTO_INCREMENT,
    cohort_id   INT      NOT NULL,
    number      INT      NOT NULL,
    capacity    INT      NOT NULL DEFAULT 30,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_sections_cohort_number UNIQUE (cohort_id, number),
    CONSTRAINT chk_sections_number_positive CHECK (number > 0),
    CONSTRAINT chk_sections_capacity_positive CHECK (capacity > 0),
    CONSTRAINT fk_sections_cohort
        FOREIGN KEY (cohort_id) REFERENCES cohorts (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
    id             INT      NOT NULL AUTO_INCREMENT,
    user_id        INT      NOT NULL,
    faculty_id     INT      NULL DEFAULT NULL,
    department_id  INT      NULL DEFAULT NULL,
    cohort_id      INT      NULL DEFAULT NULL,
    section_id     INT      NULL DEFAULT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_user_profiles_user_id UNIQUE (user_id),
    INDEX idx_user_profiles_faculty_id (faculty_id),
    INDEX idx_user_profiles_department_id (department_id),
    INDEX idx_user_profiles_cohort_id (cohort_id),
    INDEX idx_user_profiles_section_id (section_id),
    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_profiles_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_user_profiles_department
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_user_profiles_cohort
        FOREIGN KEY (cohort_id) REFERENCES cohorts (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_user_profiles_section
        FOREIGN KEY (section_id) REFERENCES sections (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 003: Curriculum & Assignments ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rooms (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)  NOT NULL,
    capacity    INT          NOT NULL DEFAULT 30,
    room_type   ENUM(
                    'NORMAL',
                    'PC_LAB',
                    'SCIENCE_LAB',
                    'DRAWING_STUDIO',
                    'AMPHITHEATER'
                )            NOT NULL DEFAULT 'NORMAL',
    building    VARCHAR(50)  NULL DEFAULT NULL,
    floor       SMALLINT     NULL DEFAULT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_rooms_name UNIQUE (name),
    CONSTRAINT chk_rooms_capacity_positive CHECK (capacity > 0),
    INDEX idx_rooms_active_type_capacity (is_active, room_type, capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS time_slots (
    id           INT              NOT NULL AUTO_INCREMENT,
    slot_number  TINYINT UNSIGNED NOT NULL,
    label        VARCHAR(30)      NOT NULL,
    start_time   TIME             NOT NULL,
    end_time     TIME             NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_time_slots_slot_number UNIQUE (slot_number),
    CONSTRAINT chk_time_slots_time_range CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subjects (
    id                  INT          NOT NULL AUTO_INCREMENT,
    name                VARCHAR(150) NOT NULL,
    code                VARCHAR(30)  NULL DEFAULT NULL,
    credits             INT          NOT NULL,
    department_id       INT          NOT NULL,
    weekly_hours        INT          NOT NULL DEFAULT 1
                        COMMENT 'Weekly 80-minute slot count',
    required_room_type  ENUM(
                            'NORMAL',
                            'PC_LAB',
                            'SCIENCE_LAB',
                            'DRAWING_STUDIO',
                            'AMPHITHEATER'
                        )            NOT NULL DEFAULT 'NORMAL'
                        COMMENT 'Required classroom type for scheduling',
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_subjects_department_name UNIQUE (department_id, name),
    CONSTRAINT chk_subjects_credits_positive CHECK (credits > 0),
    CONSTRAINT chk_subjects_weekly_hours_positive CHECK (weekly_hours > 0),
    CONSTRAINT fk_subjects_department
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subject_assignments (
    id                INT            NOT NULL AUTO_INCREMENT,
    user_id           INT            NOT NULL COMMENT 'Assigned teacher user ID',
    subject_id        INT            NOT NULL,
    section_id        INT            NOT NULL,
    semester          ENUM('1', '2') NOT NULL,
    academic_year_id  INT            NULL DEFAULT NULL,
    created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_subject_assignments_slot
        UNIQUE (user_id, subject_id, section_id, semester),
    INDEX idx_subject_assignments_user_semester (user_id, semester),
    INDEX idx_subject_assignments_subject_id (subject_id),
    INDEX idx_subject_assignments_section_id (section_id),
    INDEX idx_subject_assignments_semester (semester),
    INDEX idx_subject_assignments_academic_year (academic_year_id),
    CONSTRAINT fk_subject_assignments_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_subject_assignments_subject
        FOREIGN KEY (subject_id) REFERENCES subjects (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_subject_assignments_section
        FOREIGN KEY (section_id) REFERENCES sections (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_subject_assignments_academic_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 004: Timetable & Scheduling ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teacher_availabilities (
    id           INT              NOT NULL AUTO_INCREMENT,
    user_id      INT              NOT NULL,
    day          ENUM(
                     'monday',
                     'tuesday',
                     'wednesday',
                     'thursday',
                     'friday',
                     'saturday'
                 )                NOT NULL,
    slot_number  TINYINT UNSIGNED NOT NULL,
    created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_teacher_availabilities_day_slot
        UNIQUE (user_id, day, slot_number),
    INDEX idx_teacher_availabilities_slot_number (slot_number),
    CONSTRAINT fk_teacher_availabilities_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_teacher_availabilities_slot
        FOREIGN KEY (slot_number) REFERENCES time_slots (slot_number)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lecture_groups (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    subject_id  INT          NOT NULL,
    semester    VARCHAR(20)  NULL DEFAULT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_lecture_groups_subject_id (subject_id),
    CONSTRAINT fk_lecture_groups_subject
        FOREIGN KEY (subject_id) REFERENCES subjects (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lecture_group_members (
    id                INT NOT NULL AUTO_INCREMENT,
    lecture_group_id  INT NOT NULL,
    assignment_id     INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_lecture_group_members_pair
        UNIQUE (lecture_group_id, assignment_id),
    INDEX idx_lecture_group_members_assignment_id (assignment_id),
    CONSTRAINT fk_lecture_group_members_group
        FOREIGN KEY (lecture_group_id) REFERENCES lecture_groups (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lecture_group_members_assignment
        FOREIGN KEY (assignment_id) REFERENCES subject_assignments (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS timetable (
    id             INT         NOT NULL AUTO_INCREMENT,
    assignment_id  INT         NOT NULL,
    day            ENUM(
                       'monday',
                       'tuesday',
                       'wednesday',
                       'thursday',
                       'friday',
                       'saturday'
                   )           NOT NULL,
    start_time     TIME        NOT NULL,
    end_time       TIME        NOT NULL,
    room           VARCHAR(50) NOT NULL DEFAULT '',
    room_id        INT         NULL DEFAULT NULL,
    created_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_timetable_assignment_day_start
        UNIQUE (assignment_id, day, start_time),
    CONSTRAINT chk_timetable_time_range CHECK (start_time < end_time),
    INDEX idx_timetable_day_start (day, start_time),
    INDEX idx_timetable_room_day_start (room_id, day, start_time),
    CONSTRAINT fk_timetable_assignment
        FOREIGN KEY (assignment_id) REFERENCES subject_assignments (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_timetable_room
        FOREIGN KEY (room_id) REFERENCES rooms (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS timetable_generation_tasks (
    id             INT      NOT NULL AUTO_INCREMENT,
    status         ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
                            NOT NULL DEFAULT 'PENDING',
    parameters     JSON     NULL,
    error_message  TEXT     NULL,
    created_by     INT      NULL DEFAULT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at   DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_timetable_tasks_status (status),
    INDEX idx_timetable_tasks_created_at (created_at),
    INDEX idx_timetable_tasks_created_by (created_by),
    CONSTRAINT fk_timetable_tasks_created_by
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS timetable_drafts (
    id             INT         NOT NULL AUTO_INCREMENT,
    task_id        INT         NOT NULL,
    assignment_id  INT         NOT NULL,
    day            ENUM(
                       'monday',
                       'tuesday',
                       'wednesday',
                       'thursday',
                       'friday',
                       'saturday'
                   )           NOT NULL,
    start_time     TIME        NOT NULL,
    end_time       TIME        NOT NULL,
    room           VARCHAR(50) NULL DEFAULT NULL,
    room_id        INT         NULL DEFAULT NULL,
    created_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_timetable_drafts_time_range CHECK (start_time < end_time),
    INDEX idx_timetable_drafts_task_id (task_id),
    INDEX idx_timetable_drafts_assignment_id (assignment_id),
    INDEX idx_timetable_drafts_room_id (room_id),
    CONSTRAINT fk_timetable_drafts_task
        FOREIGN KEY (task_id) REFERENCES timetable_generation_tasks (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_timetable_drafts_assignment
        FOREIGN KEY (assignment_id) REFERENCES subject_assignments (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_timetable_drafts_room
        FOREIGN KEY (room_id) REFERENCES rooms (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 005: Lessons, Attendance & QR Attendance ───────────────────────────────

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

-- ─── 006: Grades, Notifications & Audit Trail ───────────────────────────────

CREATE TABLE IF NOT EXISTS grades (
    id             INT          NOT NULL AUTO_INCREMENT,
    student_id     INT          NOT NULL,
    subject_id     INT          NOT NULL,
    assignment_id  INT          NULL DEFAULT NULL,
    score          DECIMAL(6,2) NOT NULL,
    max_score      DECIMAL(6,2) NOT NULL DEFAULT 100.00,
    weight         DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    comment        TEXT         NULL,
    created_by     INT          NULL DEFAULT NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_grades_score_range
        CHECK (score >= 0 AND max_score > 0 AND score <= max_score),
    CONSTRAINT chk_grades_weight_positive
        CHECK (weight > 0),
    INDEX idx_grades_student_subject (student_id, subject_id),
    INDEX idx_grades_subject_id (subject_id),
    INDEX idx_grades_assignment_id (assignment_id),
    INDEX idx_grades_created_by (created_by),
    CONSTRAINT fk_grades_student
        FOREIGN KEY (student_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_grades_subject
        FOREIGN KEY (subject_id) REFERENCES subjects (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_grades_assignment
        FOREIGN KEY (assignment_id) REFERENCES subject_assignments (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_grades_created_by
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS device_tokens (
    id           INT          NOT NULL AUTO_INCREMENT,
    user_id      INT          NOT NULL,
    token        VARCHAR(512) NOT NULL,
    device_type  ENUM('android', 'ios', 'web')
                              NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_device_tokens_token UNIQUE (token),
    INDEX idx_device_tokens_user_active (user_id, is_active),
    CONSTRAINT fk_device_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_log (
    id           INT          NOT NULL AUTO_INCREMENT,
    sender_id    INT          NULL DEFAULT NULL,
    receiver_id  INT          NOT NULL,
    title        VARCHAR(200) NOT NULL,
    body         TEXT         NOT NULL,
    status       ENUM('pending', 'sent', 'failed')
                              NOT NULL DEFAULT 'sent',
    is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_notification_log_receiver_created (receiver_id, created_at DESC),
    INDEX idx_notification_log_receiver_unread (receiver_id, is_read),
    INDEX idx_notification_log_sender_id (sender_id),
    CONSTRAINT fk_notification_log_sender
        FOREIGN KEY (sender_id) REFERENCES users (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_notification_log_receiver
        FOREIGN KEY (receiver_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    actor_id     INT          NULL DEFAULT NULL,
    action       VARCHAR(50)  NOT NULL,
    entity_name  VARCHAR(100) NOT NULL,
    entity_id    INT          NULL DEFAULT NULL,
    old_value    JSON         NULL DEFAULT NULL,
    new_value    JSON         NULL DEFAULT NULL,
    timestamp    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_logs_timestamp (timestamp DESC),
    INDEX idx_audit_logs_entity (entity_name, entity_id),
    INDEX idx_audit_logs_actor_timestamp (actor_id, timestamp DESC),
    INDEX idx_audit_logs_action (action),
    CONSTRAINT fk_audit_logs_actor
        FOREIGN KEY (actor_id) REFERENCES users (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Baseline System Seed Data ──────────────────────────────────────────────

INSERT IGNORE INTO roles (id, name, level) VALUES
    (1, 'admin',           1),
    (2, 'dean',            4),
    (3, 'teacher',         6),
    (4, 'student',         7),
    (5, 'rector',          2),
    (6, 'prorektor',       3),
    (7, 'department_head', 5);

INSERT IGNORE INTO time_slots (slot_number, label, start_time, end_time) VALUES
    (1, '1. Para', '09:00:00', '10:20:00'),
    (2, '2. Para', '10:30:00', '11:50:00'),
    (3, '3. Para', '12:20:00', '13:40:00'),
    (4, '4. Para', '13:50:00', '15:10:00');

INSERT IGNORE INTO schema_migrations (version, name) VALUES
    ('000', 'schema_migrations'),
    ('001', 'identity_and_auth'),
    ('002', 'academic_structure'),
    ('003', 'curriculum_and_assignments'),
    ('004', 'timetable_and_scheduling'),
    ('005', 'lessons_attendance_and_qr'),
    ('006', 'grades_notifications_and_audit');
