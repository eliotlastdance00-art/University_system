-- ============================================================================
-- Rollback: 005_lessons_attendance_and_qr.down.sql
-- Reverts:  005_lessons_attendance_and_qr.sql
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS qr_attendance_logs;
DROP TABLE IF EXISTS qr_sessions;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS lessons;

DELETE FROM schema_migrations WHERE version = '005';
