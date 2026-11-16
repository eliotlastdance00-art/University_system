-- ============================================================================
-- Migration: 004_timetable_and_scheduling.sql
-- Target:    MySQL 8.0+ (InnoDB, utf8mb4_unicode_ci)
-- Purpose:   Teacher availability, merged lecture groups, timetable slots,
--            async CSP generation tasks, and draft schedules.
-- Tables:    teacher_availabilities, lecture_groups, lecture_group_members,
--            timetable, timetable_generation_tasks, timetable_drafts
-- Depends:   001_identity_and_auth.sql, 003_curriculum_and_assignments.sql
-- Fixes:
--   - Defines `room_id` FK cleanly on both `timetable` and `timetable_drafts`
--     without duplicate column/constraint errors.
--   - Standardizes `timetable_drafts.assignment_id` and `day` ENUM from the
--     start (replaces broken `003_fix_timetable_drafts.sql`).
--   - Adds UNIQUE (assignment_id, day, start_time), CHECK (start_time < end_time),
--     and conflict-lookup indexes on `(day, start_time)` and `(room_id, day, start_time)`.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

-- 1. Teacher weekly slot availability
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

-- 2. Combined lecture groups (multiple sections sharing one lecture room/slot)
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

-- 3. Lecture group member assignments
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

-- 4. Published weekly timetable slots
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

-- 5. Async timetable generation background tasks (ARQ worker)
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

-- 6. Generated draft timetable slots awaiting review/apply
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

INSERT IGNORE INTO schema_migrations (version, name)
VALUES ('004', 'timetable_and_scheduling');
