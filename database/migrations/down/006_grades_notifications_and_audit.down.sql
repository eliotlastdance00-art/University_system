-- ============================================================================
-- Rollback: 006_grades_notifications_and_audit.down.sql
-- Reverts:  006_grades_notifications_and_audit.sql
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notification_log;
DROP TABLE IF EXISTS device_tokens;
DROP TABLE IF EXISTS grades;

DELETE FROM schema_migrations WHERE version = '006';
