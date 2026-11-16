-- ============================================================================
-- Migration: 002_academic_structure.sql
-- Target:    MySQL 8.0+ (InnoDB, utf8mb4_unicode_ci)
-- Purpose:   University organizational hierarchy and user academic profiles.
-- Tables:    faculties, departments, academic_years, programs, cohorts,
--            sections, user_profiles
-- Depends:   001_identity_and_auth.sql
-- Fixes:
--   - Makes `faculties.code` NOT NULL UNIQUE (used as natural key in service).
--   - Adds missing `programs.code` column (NOT NULL UNIQUE).
--   - Adds missing `cohorts.academic_year_id` FK, makes `cohorts.name` NULL,
--     and enforces UNIQUE (program_id, academic_year_id).
--   - Fixes `sections.number` type to INT NOT NULL with UNIQUE (cohort_id, number)
--     and CHECK (capacity > 0).
--   - Adds missing `user_profiles.cohort_id` FK (used by notification scoping).
--   - Uses ON DELETE RESTRICT on structural hierarchy to prevent accidental
--     cascading deletion of entire faculties/departments/programs.
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

-- 1. Faculties
CREATE TABLE IF NOT EXISTS faculties (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150) NOT NULL,
    code        VARCHAR(20)  NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_faculties_name UNIQUE (name),
    CONSTRAINT uq_faculties_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150) NOT NULL,
    faculty_id  INT          NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_departments_name UNIQUE (name),
    INDEX idx_departments_faculty_id (faculty_id),
    CONSTRAINT fk_departments_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Academic years
CREATE TABLE IF NOT EXISTS academic_years (
    id          INT      NOT NULL AUTO_INCREMENT,
    year_start  INT      NOT NULL,
    year_end    INT      NOT NULL,
    is_active   BOOLEAN  NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_academic_years_range UNIQUE (year_start, year_end),
    CONSTRAINT chk_academic_years_range CHECK (year_start < year_end),
    INDEX idx_academic_years_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Degree programs
CREATE TABLE IF NOT EXISTS programs (
    id             INT          NOT NULL AUTO_INCREMENT,
    name           VARCHAR(150) NOT NULL,
    code           VARCHAR(30)  NOT NULL,
    department_id  INT          NOT NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_programs_name UNIQUE (name),
    CONSTRAINT uq_programs_code UNIQUE (code),
    INDEX idx_programs_department_id (department_id),
    CONSTRAINT fk_programs_department
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Student intake cohorts (program + academic year)
CREATE TABLE IF NOT EXISTS cohorts (
    id                INT          NOT NULL AUTO_INCREMENT,
    name              VARCHAR(100) NULL DEFAULT NULL,
    program_id        INT          NOT NULL,
    academic_year_id  INT          NOT NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_cohorts_program_year UNIQUE (program_id, academic_year_id),
    INDEX idx_cohorts_academic_year_id (academic_year_id),
    INDEX idx_cohorts_name (name),
    CONSTRAINT fk_cohorts_program
        FOREIGN KEY (program_id) REFERENCES programs (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cohorts_academic_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Class sections (groups within a cohort)
CREATE TABLE IF NOT EXISTS sections (
    id          INT      NOT NULL AUTO_INCREMENT,
    cohort_id   INT      NOT NULL,
    number      INT      NOT NULL,
    capacity    INT      NOT NULL DEFAULT 30,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_sections_cohort_number UNIQUE (cohort_id, number),
    CONSTRAINT chk_sections_number_positive CHECK (number > 0),
    CONSTRAINT chk_sections_capacity_positive CHECK (capacity > 0),
    CONSTRAINT fk_sections_cohort
        FOREIGN KEY (cohort_id) REFERENCES cohorts (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. User academic profile (1:1 extension of users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id             INT      NOT NULL AUTO_INCREMENT,
    user_id        INT      NOT NULL,
    faculty_id     INT      NULL DEFAULT NULL,
    department_id  INT      NULL DEFAULT NULL,
    cohort_id      INT      NULL DEFAULT NULL,
    section_id     INT      NULL DEFAULT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_user_profiles_user_id UNIQUE (user_id),
    INDEX idx_user_profiles_faculty_id (faculty_id),
    INDEX idx_user_profiles_department_id (department_id),
    INDEX idx_user_profiles_cohort_id (cohort_id),
    INDEX idx_user_profiles_section_id (section_id),
    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_profiles_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_user_profiles_department
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_user_profiles_cohort
        FOREIGN KEY (cohort_id) REFERENCES cohorts (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_user_profiles_section
        FOREIGN KEY (section_id) REFERENCES sections (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version, name)
VALUES ('002', 'academic_structure');
