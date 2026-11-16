-- ============================================================================
-- Rollback: 002_academic_structure.down.sql
-- Reverts:  002_academic_structure.sql
-- Requires: 006..003 rolled back first.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS cohorts;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS academic_years;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS faculties;

DELETE FROM schema_migrations WHERE version = '002';
