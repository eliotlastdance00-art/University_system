-- ============================================================================
-- Rollback: 004_timetable_and_scheduling.down.sql
-- Reverts:  004_timetable_and_scheduling.sql
-- Requires: 005 rolled back first (lessons -> timetable).
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS timetable_drafts;
DROP TABLE IF EXISTS timetable_generation_tasks;
DROP TABLE IF EXISTS timetable;
DROP TABLE IF EXISTS lecture_group_members;
DROP TABLE IF EXISTS lecture_groups;
DROP TABLE IF EXISTS teacher_availabilities;

DELETE FROM schema_migrations WHERE version = '004';
