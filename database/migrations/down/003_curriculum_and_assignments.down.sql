-- ============================================================================
-- Rollback: 003_curriculum_and_assignments.down.sql
-- Reverts:  003_curriculum_and_assignments.sql
-- Requires: 006, 005, 004 rolled back first.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS subject_assignments;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS rooms;

DELETE FROM schema_migrations WHERE version = '003';
