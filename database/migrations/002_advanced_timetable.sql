-- ============================================================
-- 002 — Advanced Timetable Generator Schema
--
-- Bu migration advanced ders programı jeneratörü için gerekli
-- tüm tablo ve kolon değişikliklerini içerir.
--
-- Çalıştırma sırası: schema.sql → 001 → BU DOSYA
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
-- 1. ROOMS TABLOSU (Derslikler)
--    Artık "Room A, Room B" gibi hardcoded string yerine
--    veritabanından gelecek, kapasite + tip bilgisi ile.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rooms (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,           -- Örn: "A-101", "B-Lab-2"
    capacity    INT          NOT NULL DEFAULT 30,       -- Kaç kişi sığar
    room_type   ENUM(
        'NORMAL',           -- Normal derslik / amfi
        'PC_LAB',           -- Bilgisayar laboratuvarı
        'SCIENCE_LAB',      -- Fizik / Kimya / Biyoloji lab
        'DRAWING_STUDIO',   -- Çizim atölyesi
        'AMPHITHEATER'      -- Büyük amfi (200+ kişi)
    ) NOT NULL DEFAULT 'NORMAL',
    building    VARCHAR(50)  NULL,                      -- Bina adı (opsiyonel)
    floor       TINYINT      NULL,                      -- Kat numarası (opsiyonel)
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,     -- Bakımdaysa FALSE yapılır
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- 2. TIME_SLOTS TABLOSU (Para/Ders Saati Dilimleri)
--    80 dakikalık "para" sistemi. Hardcoded yerine config.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS time_slots (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    slot_number TINYINT     NOT NULL UNIQUE,   -- 1, 2, 3, 4
    label       VARCHAR(30) NOT NULL,          -- "1. Para", "2. Para"
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL
);

-- Varsayılan 4 para (80 dk ders + aralar):
INSERT IGNORE INTO time_slots (slot_number, label, start_time, end_time) VALUES
    (1, '1. Para', '09:00:00', '10:20:00'),
    (2, '2. Para', '10:30:00', '11:50:00'),
    (3, '3. Para', '12:20:00', '13:40:00'),
    (4, '4. Para', '13:50:00', '15:10:00');

-- ─────────────────────────────────────────────────────────────
-- 3. TEACHER_AVAILABILITIES (Hoca Müsaitlik Tablosu)
--    Part-time hocalar sadece belirli günler gelir.
--    Bu tabloda kayıt YOKSA → hoca o gün MÜSAİT DEĞİL.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teacher_availabilities (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,                           -- Hoca (teacher)
    day         ENUM('monday','tuesday','wednesday',
                     'thursday','friday','saturday')
                NOT NULL,
    slot_number TINYINT NOT NULL,                       -- Hangi para müsait (1-4)
    UNIQUE KEY uq_teacher_day_slot (user_id, day, slot_number),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_number) REFERENCES time_slots(slot_number) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 4. SUBJECTS TABLOSUNA YENİ KOLONLAR
--    weekly_hours  : Haftada kaç para okunur (1, 2, 3 ...)
--    required_room_type : Bu ders hangi tip odada yapılmalı
-- ─────────────────────────────────────────────────────────────

ALTER TABLE subjects
    ADD COLUMN IF NOT EXISTS weekly_hours INT NOT NULL DEFAULT 1
        COMMENT 'Haftada kaç para (80dk blok) okunur',
    ADD COLUMN IF NOT EXISTS required_room_type ENUM(
        'NORMAL', 'PC_LAB', 'SCIENCE_LAB', 'DRAWING_STUDIO', 'AMPHITHEATER'
    ) NOT NULL DEFAULT 'NORMAL'
        COMMENT 'Dersin yapılması gereken oda tipi';

-- ─────────────────────────────────────────────────────────────
-- 5. TIMETABLE TABLOSU — room_id FK EKLEME
--    Artık room bir string değil, rooms tablosuna FK olacak.
--    Mevcut string "room" kolonu korunur (backward compat),
--    yeni room_id eklenir.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE timetable
    ADD COLUMN IF NOT EXISTS room_id INT NULL AFTER room,
    ADD CONSTRAINT fk_timetable_room
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- 6. TIMETABLE_DRAFTS TABLOSU — room_id FK EKLEME
-- ─────────────────────────────────────────────────────────────

ALTER TABLE timetable_drafts
    ADD COLUMN IF NOT EXISTS room_id INT NULL AFTER room,
    ADD CONSTRAINT fk_draft_room
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- 7. LECTURE GROUPS (Birleşen Sınıflar)
--    Teorik derslerde 4 section aynı amfide birleşir.
--    Bu tablo hangi assignment'ların birlikte okunacağını tanımlar.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lecture_groups (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,                  -- Örn: "Matematik-1 Lecture (1. Kurs)"
    subject_id  INT NOT NULL,
    semester    VARCHAR(20),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lecture_group_members (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    lecture_group_id  INT NOT NULL,
    assignment_id     INT NOT NULL,                     -- subject_assignments.id
    UNIQUE KEY uq_group_assignment (lecture_group_id, assignment_id),
    FOREIGN KEY (lecture_group_id) REFERENCES lecture_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES subject_assignments(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────
-- ÖRNEK VERİ (TEST İÇİN — İSTERSEN SİL)
-- ─────────────────────────────────────────────────────────────

-- Derslikler
INSERT IGNORE INTO rooms (name, capacity, room_type, building, floor) VALUES
    ('A-101', 40,  'NORMAL',       'A Blok', 1),
    ('A-102', 40,  'NORMAL',       'A Blok', 1),
    ('A-201', 60,  'NORMAL',       'A Blok', 2),
    ('A-202', 60,  'NORMAL',       'A Blok', 2),
    ('B-101', 30,  'PC_LAB',       'B Blok', 1),
    ('B-102', 30,  'PC_LAB',       'B Blok', 1),
    ('B-201', 25,  'SCIENCE_LAB',  'B Blok', 2),
    ('C-AMF', 200, 'AMPHITHEATER', 'C Blok', 0),
    ('C-101', 50,  'NORMAL',       'C Blok', 1),
    ('C-102', 50,  'NORMAL',       'C Blok', 1);
