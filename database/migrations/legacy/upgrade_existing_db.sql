-- ============================================================================
-- Legacy Upgrade Migration: upgrade_existing_db.sql
-- Target:  MySQL 8.0+ (run via `mysql` CLI client)
-- Purpose: Safely upgrade an EXISTING populated database (created from the old
--          schema.sql / 001..003 migrations) without dropping data.
--
-- NOTE: For a FRESH database, you do NOT need this file — simply run
--       000_schema_migrations.sql through 006_grades_notifications_and_audit.sql
--       in order.
--
-- For an EXISTING database with live data:
--   1. Back up the database first (`mysqldump`).
--   2. Run this script (`upgrade_existing_db.sql`) to patch existing tables.
--   3. Run `000`..`006` so any missing tables and `schema_migrations` records
--      are created cleanly.
--
-- Why stored procedures? MySQL 8.0 does NOT support `ALTER TABLE ... ADD COLUMN
-- IF NOT EXISTS` (that is MariaDB syntax and throws ERROR 1064 in MySQL 8.0).
-- Querying `INFORMATION_SCHEMA` makes every step idempotent on MySQL 8.0.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

DROP PROCEDURE IF EXISTS _mig_add_col;
DROP PROCEDURE IF EXISTS _mig_add_idx;
DROP PROCEDURE IF EXISTS _mig_add_fk_on_col;
DROP PROCEDURE IF EXISTS _mig_drop_fk_on_col;
DROP PROCEDURE IF EXISTS _mig_apply_legacy_fixes;

DELIMITER $$

CREATE PROCEDURE _mig_add_col(
    IN p_table VARCHAR(64),
    IN p_col   VARCHAR(64),
    IN p_def   TEXT
)
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = p_table
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name   = p_table
          AND column_name  = p_col
    ) THEN
        SET @_mig_sql = CONCAT(
            'ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_def
        );
        PREPARE _mig_stmt FROM @_mig_sql;
        EXECUTE _mig_stmt;
        DEALLOCATE PREPARE _mig_stmt;
    END IF;
END$$

CREATE PROCEDURE _mig_add_idx(
    IN p_table   VARCHAR(64),
    IN p_idx     VARCHAR(64),
    IN p_idx_ddl TEXT
)
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = p_table
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name   = p_table
          AND index_name   = p_idx
    ) THEN
        SET @_mig_sql = CONCAT('ALTER TABLE `', p_table, '` ADD ', p_idx_ddl);
        PREPARE _mig_stmt FROM @_mig_sql;
        EXECUTE _mig_stmt;
        DEALLOCATE PREPARE _mig_stmt;
    END IF;
END$$

CREATE PROCEDURE _mig_add_fk_on_col(
    IN p_table     VARCHAR(64),
    IN p_col       VARCHAR(64),
    IN p_ref_table VARCHAR(64),
    IN p_fk_name   VARCHAR(64),
    IN p_fk_ddl    TEXT
)
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name   = p_table
          AND column_name  = p_col
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name   = p_ref_table
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.key_column_usage
        WHERE table_schema          = DATABASE()
          AND table_name            = p_table
          AND column_name           = p_col
          AND referenced_table_name IS NOT NULL
    ) THEN
        SET @_mig_sql = CONCAT(
            'ALTER TABLE `', p_table, '` ADD CONSTRAINT `', p_fk_name, '` ', p_fk_ddl
        );
        PREPARE _mig_stmt FROM @_mig_sql;
        EXECUTE _mig_stmt;
        DEALLOCATE PREPARE _mig_stmt;
    END IF;
END$$

CREATE PROCEDURE _mig_drop_fk_on_col(
    IN p_table VARCHAR(64),
    IN p_col   VARCHAR(64)
)
BEGIN
    DECLARE v_fk VARCHAR(64) DEFAULT NULL;

    SELECT constraint_name INTO v_fk
    FROM information_schema.key_column_usage
    WHERE table_schema          = DATABASE()
      AND table_name            = p_table
      AND column_name           = p_col
      AND referenced_table_name IS NOT NULL
    LIMIT 1;

    IF v_fk IS NOT NULL THEN
        SET @_mig_sql = CONCAT(
            'ALTER TABLE `', p_table, '` DROP FOREIGN KEY `', v_fk, '`'
        );
        PREPARE _mig_stmt FROM @_mig_sql;
        EXECUTE _mig_stmt;
        DEALLOCATE PREPARE _mig_stmt;
    END IF;
END$$

CREATE PROCEDURE _mig_apply_legacy_fixes()
BEGIN
    -- 1. roles.level
    CALL _mig_add_col('roles', 'level', 'SMALLINT UNSIGNED NOT NULL DEFAULT 99 AFTER `name`');
    CALL _mig_add_col('roles', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'roles' AND column_name = 'level'
    ) THEN
        UPDATE roles SET level = CASE name
            WHEN 'admin'           THEN 1
            WHEN 'rector'          THEN 2
            WHEN 'prorektor'       THEN 3
            WHEN 'dean'            THEN 4
            WHEN 'department_head' THEN 5
            WHEN 'teacher'         THEN 6
            WHEN 'student'         THEN 7
            ELSE level
        END;
        INSERT IGNORE INTO roles (name, level) VALUES
            ('admin', 1), ('rector', 2), ('prorektor', 3),
            ('dean', 4), ('department_head', 5), ('teacher', 6), ('student', 7);
    END IF;
    CALL _mig_add_idx('roles', 'idx_roles_level', 'INDEX `idx_roles_level` (`level`)');

    -- 2. refresh_tokens: revoked -> is_revoked, token width + index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name   = 'refresh_tokens'
          AND column_name  = 'revoked'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name   = 'refresh_tokens'
          AND column_name  = 'is_revoked'
    ) THEN
        ALTER TABLE refresh_tokens
            CHANGE COLUMN `revoked` `is_revoked` BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    CALL _mig_add_col('refresh_tokens', 'is_revoked', 'BOOLEAN NOT NULL DEFAULT FALSE AFTER `token`');
    CALL _mig_add_col(
        'refresh_tokens',
        'updated_at',
        'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    );
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'refresh_tokens'
    ) THEN
        ALTER TABLE refresh_tokens
            MODIFY COLUMN `token` VARCHAR(512) NOT NULL,
            MODIFY COLUMN `expires_at` DATETIME NOT NULL;
    END IF;
    CALL _mig_add_idx(
        'refresh_tokens',
        'idx_refresh_tokens_user_revoked',
        'INDEX `idx_refresh_tokens_user_revoked` (`user_id`, `is_revoked`)'
    );

    -- 3. programs.code
    CALL _mig_add_col('programs', 'code', 'VARCHAR(30) NULL AFTER `name`');
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'programs' AND column_name = 'code'
    ) THEN
        UPDATE programs SET code = CONCAT('PRG-', id) WHERE code IS NULL OR code = '';
        ALTER TABLE programs MODIFY COLUMN `code` VARCHAR(30) NOT NULL;
    END IF;
    CALL _mig_add_idx('programs', 'uq_programs_code', 'UNIQUE KEY `uq_programs_code` (`code`)');

    -- 4. cohorts: add academic_year_id, make name nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'cohorts' AND column_name = 'name'
    ) THEN
        ALTER TABLE cohorts MODIFY COLUMN `name` VARCHAR(100) NULL DEFAULT NULL;
    END IF;
    CALL _mig_add_col('cohorts', 'academic_year_id', 'INT NULL AFTER `program_id`');
    CALL _mig_add_fk_on_col(
        'cohorts',
        'academic_year_id',
        'academic_years',
        'fk_cohorts_academic_year',
        'FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE'
    );

    -- 5. user_profiles.cohort_id
    CALL _mig_add_col('user_profiles', 'cohort_id', 'INT NULL DEFAULT NULL AFTER `department_id`');
    CALL _mig_add_idx(
        'user_profiles',
        'idx_user_profiles_cohort_id',
        'INDEX `idx_user_profiles_cohort_id` (`cohort_id`)'
    );
    CALL _mig_add_fk_on_col(
        'user_profiles',
        'cohort_id',
        'cohorts',
        'fk_user_profiles_cohort',
        'FOREIGN KEY (`cohort_id`) REFERENCES `cohorts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE'
    );

    -- 6. rooms (needed before timetable room_id FK)
    CREATE TABLE IF NOT EXISTS rooms (
        id          INT          NOT NULL AUTO_INCREMENT,
        name        VARCHAR(50)  NOT NULL,
        capacity    INT          NOT NULL DEFAULT 30,
        room_type   ENUM('NORMAL','PC_LAB','SCIENCE_LAB','DRAWING_STUDIO','AMPHITHEATER')
                                 NOT NULL DEFAULT 'NORMAL',
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

    -- 7. subjects: credits, weekly_hours, required_room_type
    CALL _mig_add_col('subjects', 'credits', 'INT NOT NULL DEFAULT 3 AFTER `name`');
    CALL _mig_add_col('subjects', 'weekly_hours', 'INT NOT NULL DEFAULT 1');
    CALL _mig_add_col(
        'subjects',
        'required_room_type',
        "ENUM('NORMAL','PC_LAB','SCIENCE_LAB','DRAWING_STUDIO','AMPHITHEATER') NOT NULL DEFAULT 'NORMAL'"
    );

    -- 8. timetable: room_id + FK
    CALL _mig_add_col('timetable', 'room_id', 'INT NULL DEFAULT NULL AFTER `room`');
    CALL _mig_add_fk_on_col(
        'timetable',
        'room_id',
        'rooms',
        'fk_timetable_room',
        'FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE'
    );

    -- 9. timetable_drafts: subject_assignment_id -> assignment_id,
    --    day_of_week TINYINT -> day ENUM (with safe 1..6 value conversion), room_id + FK
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name   = 'timetable_drafts'
          AND column_name  = 'subject_assignment_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name   = 'timetable_drafts'
          AND column_name  = 'assignment_id'
    ) THEN
        CALL _mig_drop_fk_on_col('timetable_drafts', 'subject_assignment_id');
        ALTER TABLE timetable_drafts
            CHANGE COLUMN `subject_assignment_id` `assignment_id` INT NOT NULL;
        CALL _mig_add_fk_on_col(
            'timetable_drafts',
            'assignment_id',
            'subject_assignments',
            'fk_timetable_drafts_assignment',
            'FOREIGN KEY (`assignment_id`) REFERENCES `subject_assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE'
        );
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name   = 'timetable_drafts'
          AND column_name  = 'day_of_week'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name   = 'timetable_drafts'
          AND column_name  = 'day'
    ) THEN
        ALTER TABLE timetable_drafts
            ADD COLUMN `day` ENUM('monday','tuesday','wednesday','thursday','friday','saturday')
            NULL AFTER `assignment_id`;
        UPDATE timetable_drafts SET `day` = CASE `day_of_week`
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
            ELSE 'monday'
        END;
        ALTER TABLE timetable_drafts
            MODIFY COLUMN `day` ENUM('monday','tuesday','wednesday','thursday','friday','saturday') NOT NULL,
            DROP COLUMN `day_of_week`;
    END IF;

    CALL _mig_add_col('timetable_drafts', 'room_id', 'INT NULL DEFAULT NULL AFTER `room`');
    CALL _mig_add_fk_on_col(
        'timetable_drafts',
        'room_id',
        'rooms',
        'fk_timetable_drafts_room',
        'FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE'
    );

    -- 10. lessons: add missing note, normalize status values
    CALL _mig_add_col('lessons', 'note', 'TEXT NULL AFTER `status`');
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'lessons'
    ) THEN
        UPDATE lessons SET status = 'completed' WHERE status = 'held';
        ALTER TABLE lessons
            MODIFY COLUMN `status` ENUM('scheduled', 'completed', 'cancelled')
            NOT NULL DEFAULT 'completed';
    END IF;

    -- 11. qr_sessions: generated active_lesson_id + unique constraint
    CALL _mig_add_col(
        'qr_sessions',
        'active_lesson_id',
        "INT GENERATED ALWAYS AS (CASE WHEN `status` = 'active' THEN `lesson_id` ELSE NULL END) VIRTUAL"
    );
    CALL _mig_add_idx(
        'qr_sessions',
        'uq_qr_sessions_active_lesson',
        'UNIQUE KEY `uq_qr_sessions_active_lesson` (`active_lesson_id`)'
    );

    -- 12. device_tokens: add device_type, is_active, updated_at, widen token
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'device_tokens'
    ) THEN
        ALTER TABLE device_tokens MODIFY COLUMN `token` VARCHAR(512) NOT NULL;
    END IF;
    CALL _mig_add_col(
        'device_tokens',
        'device_type',
        "ENUM('android', 'ios', 'web') NOT NULL DEFAULT 'web' AFTER `token`"
    );
    CALL _mig_add_col('device_tokens', 'is_active', 'BOOLEAN NOT NULL DEFAULT TRUE AFTER `device_type`');
    CALL _mig_add_col(
        'device_tokens',
        'updated_at',
        'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    );

    -- 13. notification_log: add sender_id, status
    CALL _mig_add_col('notification_log', 'sender_id', 'INT NULL DEFAULT NULL AFTER `id`');
    CALL _mig_add_col(
        'notification_log',
        'status',
        "ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'sent' AFTER `body`"
    );
    CALL _mig_add_fk_on_col(
        'notification_log',
        'sender_id',
        'users',
        'fk_notification_log_sender',
        'FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE'
    );

    -- 14. audit_logs: widen id to BIGINT, allow NULL on actor_id (ON DELETE SET NULL) and entity_id
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'audit_logs'
    ) THEN
        CALL _mig_drop_fk_on_col('audit_logs', 'actor_id');
        ALTER TABLE audit_logs
            MODIFY COLUMN `id`        BIGINT NOT NULL AUTO_INCREMENT,
            MODIFY COLUMN `actor_id`  INT NULL DEFAULT NULL,
            MODIFY COLUMN `entity_id` INT NULL DEFAULT NULL,
            MODIFY COLUMN `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
        CALL _mig_add_fk_on_col(
            'audit_logs',
            'actor_id',
            'users',
            'fk_audit_logs_actor',
            'FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE'
        );
    END IF;
END$$

DELIMITER ;

CALL _mig_apply_legacy_fixes();

DROP PROCEDURE IF EXISTS _mig_apply_legacy_fixes;
DROP PROCEDURE IF EXISTS _mig_drop_fk_on_col;
DROP PROCEDURE IF EXISTS _mig_add_fk_on_col;
DROP PROCEDURE IF EXISTS _mig_add_idx;
DROP PROCEDURE IF EXISTS _mig_add_col;
