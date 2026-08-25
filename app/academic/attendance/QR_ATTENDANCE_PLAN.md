# 📋 QR-kod esasly Attendance Ulgamy — PLAN

## 1. Häzirki ýagdaý (As-Is)

Häzirki attendance ulgamy **mugallym el bilen** belleýär:
- `POST /attendance/lesson/{lesson_id}` — mugallym bulk halda studentleri `present/absent` edýär
- Studentleriň özi attendance bellemek mümkinçiligi **ýok**
- QR-kod ýok, session ýok

## 2. Maksat (To-Be)

**Session-esasly, wagt bilen çäklenen QR-kod ulgamy:**

1. Mugallym sapak başlanda **QR session** açýar
2. Ulgam unikal, wagtly QR-kod generate edýär
3. Studentler QR-kody skanirläp, **verify** edýärler
4. QR-kod **cheating-e garşy** gorag bilen üpjün edilýär

---

## 3. Anti-Cheating Strategiýasy 🛡️

### Mesele: Student QR-kody surata alyp, sapakda bolmadyk dostuňa ugratsa?

### Çözgüdi: **Köp gatly gorag (Multi-Layer Protection)**

| Gatlak | Mehanizm | Nähili işleýär |
|--------|----------|----------------|
| **1. Wagt çäklendirmesi** | QR token her 30 sekuntda täzelenýär | Surata alnan QR 30s-dan soň işlemeýär |
| **2. Rotating token** | QR-koduň içindäki token her 30s üýtgeýär | Mugallymyň ekranynda QR real-time üýtgeýär, student köne suraty ugratsa — expired |
| **3. Session baglanyşygy** | QR diňe açyk session wagtynda işleýär | Mugallym session-y ýapandan soň hiç kim bellenip bilmez |
| **4. Dublikat goragy** | Bir student 1 session-da diňe 1 gezek bellenip biler | Şol bir student ikinji gezek scan etse — "eýýäm bellendiňiz" |
| **5. Enrollment check** | Student şol sapagyň section-yna degişlimi barlanýar | Başga topardan student scan etse — "bu sapak size degişli däl" |
| **6. Device fingerprint** | User-Agent + IP hash saklanýar (audit) | Şol bir device-dan 2 student bellenip bilmez (goşmaça gatlak) |

### Iň esasy gorag: **Rotating QR (her 30s täzelenýär)**
- Mugallymyň telefonynda/kompýuterinde QR her 30 sekuntda täzelenýär
- Student surata alsa, 30s içinde ugratmaly + dosty scan etmeli — hakyky ýagdaýda gaty kyn
- Her rotasiýada täze `token` generasiýa edilýär

---

## 4. Arhitektura

### 4.1 Täze Database Tablisalary

```sql
-- ═══════════════════════════════════════════════
-- QR Attendance Session tablisasy
-- ═══════════════════════════════════════════════
CREATE TABLE qr_sessions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id       INT NOT NULL,
    teacher_id      INT NOT NULL,
    
    -- Session ýagdaýy
    status          ENUM('active', 'closed') DEFAULT 'active',
    
    -- Häzirki aktiw token (her 30s üýtgeýär)
    current_token   VARCHAR(64) NOT NULL,
    token_expires_at DATETIME NOT NULL,
    
    -- Session wagty
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at       DATETIME NULL,
    
    -- Çäklendirmeler
    FOREIGN KEY (lesson_id) REFERENCES lessons(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    UNIQUE KEY uq_lesson_active (lesson_id, status)
);

-- ═══════════════════════════════════════════════
-- QR arkaly gelen attendance ýazgylary
-- ═══════════════════════════════════════════════
CREATE TABLE qr_attendance_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    session_id      INT NOT NULL,
    student_id      INT NOT NULL,
    
    -- Metadata (audit / anti-cheat üçin)
    scanned_token   VARCHAR(64) NOT NULL,
    device_hash     VARCHAR(128) NULL,
    ip_address      VARCHAR(45) NULL,
    scanned_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Bir student bir session-da diňe 1 gezek
    FOREIGN KEY (session_id) REFERENCES qr_sessions(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE KEY uq_student_session (session_id, student_id)
);
```

### 4.2 API Endpointlary

```
# ─── MUGALLYM (Teacher) ──────────────────────────────────────

POST   /attendance/qr/session/start/{lesson_id}
       → QR session açýar, ilkinji token generate edýär
       → Response: { session_id, qr_data, expires_in }

GET    /attendance/qr/session/{session_id}/refresh
       → Täze token generate edýär (frontend her 30s çagyrýar)
       → Response: { qr_data, expires_in, present_count }

POST   /attendance/qr/session/{session_id}/close
       → Session-y ýapýar, absent studentleri awtomatik belleýär
       → Response: { present_count, absent_count, records }

GET    /attendance/qr/session/{session_id}/live
       → Häzirki scan eden studentleriň real-time sanawy
       → Response: [ { student_name, scanned_at } ]

# ─── STUDENT ─────────────────────────────────────────────────

POST   /attendance/qr/verify
       → Student QR-kody skanirläp token ugradýar
       → Request: { token, session_id }
       → Response: { status: "present", message: "Bellendi!" }
```

### 4.3 QR-kod Mazmuny (QR Payload)

QR-koduň içinde şu JSON bar:
```json
{
  "sid": 42,
  "tkn": "a1b2c3d4e5f6...",
  "ts": 1692540000
}
```

Bu JSON → Base64 encode → QR-kod string.
Student apk QR-ny skan edýär → token-i `POST /qr/verify` endpoint-a ugradýar.

### 4.4 Token Rotasiýa Mehanizmi

```
Mugallymyň ekrany:
┌─────────────────────────┐
│                         │
│     ████████████████    │   ← QR-kod (her 30s täzelenýär)
│     ████████████████    │
│     ████████████████    │
│                         │
│  Token galan wagt: 24s  │   ← Countdown timer
│  Scan eden: 15/28       │   ← Live student count
│                         │
│  [Session-y ýap]        │   ← Close button
└─────────────────────────┘

Frontend her 25s-da → GET /qr/session/{id}/refresh → täze QR alýar
(5s margin bilen, student köne token bilen ýetişsin diyip)
```

### 4.5 Verify Flow (Student tarapy)

```
Student telefonynda:
1. QR-kody skan et
2. App token-i çykarýar
3. POST /qr/verify { token: "a1b2c3...", session_id: 42 }
   └─ Backend barlaglary:
      ✓ Token dogrymy? (DB-daky current_token bilen deňeşdir)
      ✓ Token möhleti geçmedimi? (token_expires_at > now)
      ✓ Session açykmy? (status = 'active')
      ✓ Student bu session-da öň bellenmedimi? (UNIQUE constraint)
      ✓ Student bu sapagyň section-yna degişlimi? (enrollment check)
4. Hemmesi OK → attendance record döredilýär
   + köne attendance tablisasyna-da ýazylýar (backward compatible)
5. Response: "Üstünlikli bellendi! ✅"
```

---

## 5. Faýl Strukturasy

```
app/academic/attendance/
├── __init__.py              # bar (üýtgetme ýok)
├── exceptions.py            # bar + täze QR exception-lar goşulýar
├── repository.py            # bar (üýtgetme ýok — köne attendance üçin)
├── router.py                # bar (üýtgetme ýok — köne attendance üçin)
├── schemas.py               # bar (üýtgetme ýok — köne attendance üçin)
├── service.py               # bar (üýtgetme ýok — köne attendance üçin)
│
├── qr/                      # ← TÄZE papka (QR ulgamy)
│   ├── __init__.py
│   ├── router.py            # QR endpoint-lar
│   ├── schemas.py           # QR Pydantic model-lar
│   ├── service.py           # QR business logic
│   ├── repository.py        # QR database sorgulary
│   └── token_manager.py     # Token generate / validate logic
│
├── QR_ATTENDANCE_PLAN.md    # ← şu plan faýly
└── migration.sql            # ← database migration
```

---

## 6. Howpsuzlyk Seljermesi (Security Review)

### ✅ Güýçli taraplar:
1. **Rotating token (30s)** — iň esasy gorag, surata almak peýdasyz
2. **Server-side validation** — token backend-de barlanyar, client-de däl
3. **Enrollment check** — diňe şol sapaga degişli student bellenip bilýär
4. **UNIQUE constraint** — duplicate attendance mümkin däl (DB derejesi)
5. **JWT auth** — diňe giriş eden studentler verify edip bilýär
6. **Audit log** — her scan-yň IP, device, wagty saklanýar
7. **Session ownership** — diňe sapagyň mugallymy session açyp bilýär

### ⚠️ Gowşak taraplar we çözgüdleri:

| Howp | Ähtimallyk | Çözgüd |
|------|-----------|--------|
| Student QR-ny real-time stream edýär (video call) | Orta | 30s window + mugallym live monitor-dan görýär kim scan etdi, şübheli bolsa el bilen absent edýär |
| 2 student 1 telefon ulanýar | Pes | Her student öz JWT-si bilen girmeli, log-da device_hash gabat gelýär |
| Token brute-force | Gaty pes | 32-byte hex = 2^128 mümkinçilik, 30s window |
| Rate limiting ýok | Orta | `/qr/verify` endpoint-a rate limit goşmaly (geljekde) |

### ❌ Bilkastlaýyn GOŞULMADYK zatlar:
- **GPS lokasion barlagy** — ynamdar däl, battery iýýär, privacy meselesi
- **Bluetooth proximity** — ýörite hardware gerek, çylşyrymly
- **Camera selfie** — privacy meselesi, GDPR

---

## 7. Implementasiýa Tertibi

| # | Tapgyr | Faýllar | Garaşlylyk |
|---|--------|---------|------------|
| 1 | Database migration | `migration.sql` | — |
| 2 | Token manager | `qr/token_manager.py` | — |
| 3 | QR Schemas | `qr/schemas.py` | — |
| 4 | QR Exceptions | `exceptions.py` (üsti goşulýar) | — |
| 5 | QR Repository | `qr/repository.py` | #1 |
| 6 | QR Service | `qr/service.py` | #2, #4, #5 |
| 7 | QR Router | `qr/router.py` | #3, #6 |
| 8 | main.py registrasiýa | `main.py` | #7 |

---

## 8. Dependency-lar

**Goşmaça paket GEREK DÄL** — hemme zat bar bolan paketler bilen edilýär:
- `secrets` (Python stdlib) — token generasiýa
- `hashlib` (Python stdlib) — device fingerprint hash
- `json` + `base64` (Python stdlib) — QR payload encode
- `datetime` (Python stdlib) — wagt çäklendirmesi
- QR image generasiýasy **frontend/mobile app** tarapynda

---

## 9. Backward Compatibility

Köne ulgam doly saklanýar:
- Mugallym islese **el bilen** attendance belläp bilýär (köne endpoint-lar)
- QR session close edilende, netijeler **köne `attendance` tablisasyna-da** ýazylýar
- Statistika endpoint-lary ikisinden hem maglumat alýar
