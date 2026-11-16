-- ============================================================================
-- Migration: 006_grades_notifications_and_audit.sql
-- Target:    MySQL 8.0+ (InnoDB, utf8mb4_unicode_ci)
-- Purpose:   Student grades, FCM device tokens, in-app notifications, and
--            system-wide immutable audit trail.
-- Tables:    grades, device_tokens, notification_log, audit_logs
-- Depends:   001_identity_and_auth.sql, 003_curriculum_and_assignments.sql
-- Fixes:
--   - Adds explicit ON DELETE rules and score/weight CHECK constraints on `grades`.
--   - Adds missing `device_tokens.device_type`, `is_active`, and `updated_at`
--     columns and widens `token` to VARCHAR(512) for FCM registration tokens.
--   - Adds missing `notification_log.sender_id` and `status` columns plus
--     inbox/unread composite indexes.
--   - Makes `audit_logs.actor_id` NULL (ON DELETE SET NULL so deleting a user
--     preserves audit history and never fails with FK error 1451) and makes
--     `audit_logs.entity_id` NULL (required by broadcast & system events).
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

-- 1. Student grades
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

-- 2. Firebase Cloud Messaging (FCM) device tokens
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

-- 3. In-app notification inbox & delivery log
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

-- 4. System audit trail (before/after JSON snapshots)
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

INSERT IGNORE INTO schema_migrations (version, name)
VALUES ('006', 'grades_notifications_and_audit');
