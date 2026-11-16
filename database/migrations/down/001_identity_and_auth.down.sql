-- ============================================================================
-- Rollback: 001_identity_and_auth.down.sql
-- Reverts:  001_identity_and_auth.sql
-- Requires: 006..002 rolled back first.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

DELETE FROM schema_migrations WHERE version = '001';
