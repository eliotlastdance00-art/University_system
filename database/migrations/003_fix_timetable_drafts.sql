-- ============================================================
-- 003 — Fix timetable_drafts column names
--
-- timetable_drafts tablasy eski schema-da galypdyr:
--   subject_assignment_id → assignment_id
--   day_of_week TINYINT   → day ENUM (string)
--
-- timetable tablasy eýýäm dogry migrate edilen,
-- şoňa görä timetable_drafts-y hem deň etmeli.
--
-- Çalıştırma sırası: schema.sql → 001 → 002 → BU DOSYA
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. subject_assignment_id → assignment_id
ALTER TABLE timetable_drafts
    DROP FOREIGN KEY `timetable_drafts_ibfk_2`;

ALTER TABLE timetable_drafts
    CHANGE COLUMN `subject_assignment_id` `assignment_id` INT NOT NULL;

ALTER TABLE timetable_drafts
    ADD CONSTRAINT `timetable_drafts_ibfk_2`
        FOREIGN KEY (`assignment_id`) REFERENCES `subject_assignments` (`id`) ON DELETE CASCADE;

-- 2. day_of_week TINYINT → day ENUM (timetable tablasy bilen deň)
ALTER TABLE timetable_drafts
    CHANGE COLUMN `day_of_week` `day`
        ENUM('monday','tuesday','wednesday','thursday','friday','saturday') NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;
