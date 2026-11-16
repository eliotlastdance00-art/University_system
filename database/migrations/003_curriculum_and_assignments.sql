-- ============================================================================
-- Migration: 003_curriculum_and_assignments.sql
-- Target:    MySQL 8.0+ (InnoDB, utf8mb4_unicode_ci)
-- Purpose:   Rooms, time slots, course subjects, and teaching assignments.
-- Tables:    rooms, time_slots, subjects, subject_assignments
-- Depends:   001_identity_and_auth.sql, 002_academic_structure.sql
-- Fixes:
--   - Adds missing `subjects.credits` column (NOT NULL, required by all
--     /subjects endpoints) alongside `weekly_hours` and `required_room_type`
--     without using invalid MySQL 8.0 `ADD COLUMN IF NOT EXISTS` syntax.
--   - Makes `subjects.department_id` NOT NULL with UNIQUE (department_id, name).
--   - Enforces `subject_assignments.semester` ENUM('1', '2') and DB-level
--     UNIQUE (user_id, subject_id, section_id, semester).
--   - Seeds standard 4x80-minute `time_slots` without polluting DDL with
--     demo room records.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

-- 1. Classrooms / laboratories / amphitheaters
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

-- 2. Standard 80-minute lesson blocks ("para")
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

-- 3. Subjects (course catalog)
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

-- 4. Teacher <-> Subject <-> Section <-> Semester assignments
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

-- Seed default 80-minute lesson time slots
INSERT IGNORE INTO time_slots (slot_number, label, start_time, end_time) VALUES
    (1, '1. Para', '09:00:00', '10:20:00'),
    (2, '2. Para', '10:30:00', '11:50:00'),
    (3, '3. Para', '12:20:00', '13:40:00'),
    (4, '4. Para', '13:50:00', '15:10:00');

INSERT IGNORE INTO schema_migrations (version, name)
VALUES ('003', 'curriculum_and_assignments');
