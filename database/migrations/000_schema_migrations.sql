-- ============================================================================
-- Migration: 000_schema_migrations.sql
-- Target:    MySQL 8.0+ (InnoDB, utf8mb4_unicode_ci)
-- Purpose:   Track applied database migrations in sequential order.
-- Order:     000 -> 001 -> 002 -> 003 -> 004 -> 005 -> 006
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS schema_migrations (
    version     VARCHAR(20)  NOT NULL,
    name        VARCHAR(150) NOT NULL,
    applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version, name)
VALUES ('000', 'schema_migrations');
