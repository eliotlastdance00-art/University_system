-- ============================================================
-- University System — Base Schema
--
-- Reconstructed from every FROM/JOIN/INSERT reference across
-- app/**/repository.py. This is the schema the codebase ALREADY
-- assumes exists; it was never checked into database/migrations/.
-- Run this BEFORE 001_grades_and_audit.sql.
--
-- Review column widths/defaults against your real production DB
-- before applying — some nullability choices below are inferred
-- from how the repos query the data, not from an explicit DDL
-- source, since none existed.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─── Identity ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE  -- admin | dean | teacher | student
);

CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    UNIQUE KEY uq_user_role (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ─── Academic structure ────────────────────────────────────

CREATE TABLE IF NOT EXISTS faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    faculty_id INT NOT NULL,
    UNIQUE KEY uq_department_name (name),
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cohorts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    program_id INT,
    year_start INT,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL DEFAULT 30,
    cohort_id INT,
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    faculty_id INT,
    department_id INT,
    section_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
);

-- ─── Curriculum ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year_start INT NOT NULL,
    year_end INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS subject_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,          -- teacher
    subject_id INT NOT NULL,
    section_id INT NOT NULL,
    semester VARCHAR(20),
    academic_year_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
);

-- ─── Scheduling ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    day ENUM('monday','tuesday','wednesday','thursday','friday','saturday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    room_id INT NULL,
    FOREIGN KEY (assignment_id) REFERENCES subject_assignments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timetable_generation_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    parameters JSON,
    error_message TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS timetable_drafts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    assignment_id INT NOT NULL,
    day ENUM('monday','tuesday','wednesday','thursday','friday','saturday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    room_id INT NULL,
    FOREIGN KEY (task_id) REFERENCES timetable_generation_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES subject_assignments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timetable_id INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',  -- scheduled | held | cancelled
    FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NOT NULL,
    user_id INT NOT NULL,           -- student
    status VARCHAR(20) NOT NULL,    -- present | absent | late | excused
    marked_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance (lesson_id, user_id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── Notifications ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS device_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receiver_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Auth infra ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- ─── Seed data (minimal) ────────────────────────────────────

INSERT IGNORE INTO roles (name) VALUES
    ('admin'), ('dean'), ('teacher'), ('student');