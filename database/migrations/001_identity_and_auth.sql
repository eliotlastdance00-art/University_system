-- ============================================================================
-- Migration: 001_identity_and_auth.sql
-- Target:    MySQL 8.0+ (InnoDB, utf8mb4_unicode_ci)
-- Purpose:   Core identity, RBAC role hierarchy, and refresh token registry.
-- Tables:    users, roles, user_roles, refresh_tokens
-- Fixes:
--   - Adds missing `roles.level` column (required by auth & notifications).
--   - Seeds full role hierarchy (admin, rector, prorektor, dean,
--     department_head, teacher, student) while keeping IDs 1..4 aligned.
--   - Fixes `refresh_tokens.is_revoked` column name (was wrongly `revoked`).
--   - Adds UNIQUE index on `refresh_tokens.token` (VARCHAR(512) fits InnoDB
--     3072-byte utf8mb4 key limit) and switches timestamps to UTC DATETIME.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id          INT          NOT NULL AUTO_INCREMENT,
    full_name   VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_full_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Roles (lower `level` = higher authority)
CREATE TABLE IF NOT EXISTS roles (
    id          INT               NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)       NOT NULL,
    level       SMALLINT UNSIGNED NOT NULL,
    created_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_roles_name UNIQUE (name),
    CONSTRAINT chk_roles_level_positive CHECK (level > 0),
    INDEX idx_roles_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. User <-> Role many-to-many mapping
CREATE TABLE IF NOT EXISTS user_roles (
    id          INT      NOT NULL AUTO_INCREMENT,
    user_id     INT      NOT NULL,
    role_id     INT      NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id),
    INDEX idx_user_roles_role_id (role_id),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Server-side refresh token registry (rotation & revocation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          INT          NOT NULL AUTO_INCREMENT,
    user_id     INT          NOT NULL,
    token       VARCHAR(512) NOT NULL,
    is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at  DATETIME     NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_refresh_tokens_token UNIQUE (token),
    INDEX idx_refresh_tokens_user_revoked (user_id, is_revoked),
    INDEX idx_refresh_tokens_expires_at (expires_at),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed baseline system roles:
--   IDs 1..4 preserve frontend admin role-picker mapping;
--   `level` orders authority strictly: admin(1) < rector(2) < prorektor(3)
--   < dean(4) < department_head(5) < teacher(6) < student(7).
INSERT IGNORE INTO roles (id, name, level) VALUES
    (1, 'admin',           1),
    (2, 'dean',            4),
    (3, 'teacher',         6),
    (4, 'student',         7),
    (5, 'rector',          2),
    (6, 'prorektor',       3),
    (7, 'department_head', 5);

INSERT IGNORE INTO schema_migrations (version, name)
VALUES ('001', 'identity_and_auth');
