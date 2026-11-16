-- ============================================================================
-- Rollback: 000_schema_migrations.down.sql
-- Reverts:  000_schema_migrations.sql
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS schema_migrations;
