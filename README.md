<div align="center">

# 🎓 University System

**A full-stack university management platform** — users & roles, academic structure, timetabling, attendance, grading, push notifications, and a complete audit trail.

<!-- Replace with your own logo/banner if you have one: -->
<!-- <img src=".github/assets/banner.png" alt="University System banner" width="800"/> -->

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.140-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20OTP-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](#-auth-flow)

[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE) 
[![Status](https://img.shields.io/badge/status-active%20development-yellow?style=flat-square)]()
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](./CONTRIBUTING.md)

📖 **[Architecture Docs](./ARCHITECTURE.md)** · 🤝 **[Contributing](./CONTRIBUTING.md)** · 🐛 [Report a bug](../../issues)

</div>

---

## 📸 Preview

<!--
  Drop real screenshots/GIFs in .github/assets/ and swap the paths below.
  A quick way to record a GIF of your admin dashboard flow: use
  ScreenToGif (Windows), Kap (Mac), or Peek (Linux) — keep it under
  ~5MB so it loads fast on GitHub.
-->

<div align="center">

| Admin Dashboard | Login + OTP Flow |
|---|---|
| <img src=".github/assets/admin-dashboard.png" width="380" alt="Admin dashboard screenshot"/> | <img src=".github/assets/login-otp-flow.gif" width="380" alt="Login and OTP flow demo"/> |

</div>

> 🖼️ *Screenshots above are placeholders — see [Adding Your Own Screenshots](#-adding-your-own-screenshots) for how to add real ones.*

---

## ✨ Features

- 👤 **User & Role Management** — admin/dean/teacher/student roles, profile linkage to faculty/department/section
- 🏛️ **Academic Structure** — faculties → departments → programs → cohorts → sections
- 📚 **Curriculum & Assignments** — subjects, teacher↔subject↔section mapping, academic years
- 🗓️ **Timetabling & Lessons** — scheduled slots, lesson instances, attendance per lesson
- 📊 **Grading** — scores per student/subject/assignment
- 🔔 **Push Notifications** — Firebase Cloud Messaging + in-app notification log
- 🕵️ **Full Audit Trail** — every mutation logs actor, before/after state, inside the same DB transaction
- 🔐 **JWT + Email OTP Auth** — access/refresh tokens, Argon2 password hashing, second-factor OTP

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Backend**
- ⚡ FastAPI (async) + Uvicorn
- 🐬 MySQL via `aiomysql` (raw SQL, no ORM — see [ARCHITECTURE.md](./ARCHITECTURE.md))
- 🔑 JWT auth (access + refresh) + email OTP
- 🔒 Argon2 password hashing
- 🔥 Firebase Cloud Messaging
- ⚙️ `pydantic-settings` config

</td>
<td valign="top" width="50%">

**Frontend**
- ⚛️ React 19 + Vite
- 🧭 React Router v7 (role-based route guards)
- 📡 Axios

</td>
</tr>
</table>

---

## 📁 Project Structure

```
app/            # FastAPI backend — one folder per domain, each with
                # router.py / service.py / repository.py / schemas.py / exceptions.py
database/       # SQL schema + migrations
frontend/       # React admin/teacher/student SPA
```

📖 Full layout in [ARCHITECTURE.md § Directory Structure](./ARCHITECTURE.md#2-directory-structure).

---

## 🚀 Getting Started

### 1️⃣ Backend

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # fill in DB / JWT / SMTP / Firebase values
```

Create the database and load the schema:

```bash
mysql -u root -p -e "CREATE DATABASE university_system CHARACTER SET utf8mb4"
mysql -u root -p university_system < database/schema.sql
mysql -u root -p university_system < database/migrations/001_grades_and_audit.sql
```

Run the API:

```bash
uvicorn app.main:app --reload
```

| Endpoint | URL |
|---|---|
| 🩺 Health check | `GET http://localhost:8000/` |
| 📘 Swagger UI | `http://localhost:8000/docs` |
| 📗 ReDoc | `http://localhost:8000/redoc` |
| 🔌 API base path | `/University_system/v1` |

### 2️⃣ Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` — make sure it's included in `ALLOWED_ORIGINS` in your backend `.env`.

---

## 👥 Roles

| Role | Access |
|---|---|
| 🛡️ `admin` | Full control — users, faculties, departments, assignments, academic setup |
| 🎓 `dean` | Faculty-level oversight |
| 👨‍🏫 `teacher` | Their own assignments, attendance, grading |
| 🧑‍🎓 `student` | Their own dashboard, grades, attendance |

Role is embedded in the JWT payload and enforced both server-side (`core/dependencies.py` guards) and client-side (`ProtectedRoute` + route nesting in `App.jsx`).

---

## 🔐 Auth Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as /auth
    C->>A: POST /login (email, password)
    A-->>C: otp_token cookie set, OTP emailed
    C->>A: POST /verify-otp (code)
    A-->>C: access_token + refresh_token
    C->>A: POST /refresh (when access_token expires)
    A-->>C: new access_token
    C->>A: POST /logout
    A-->>C: refresh_token revoked
```

> Send the access token as the raw `Authorization` header value on every request (no `Bearer ` prefix — see [ARCHITECTURE.md § 4](./ARCHITECTURE.md#4-auth--authorization) for why).

---

## 🖼️ Adding Your Own Screenshots

1. Create the assets folder: `mkdir -p .github/assets`
2. Drop in PNGs (screenshots) or GIFs (short flow demos, <5MB each)
3. Swap the placeholder paths in the [Preview](#-preview) table above
4. For GIFs, a screen recorder that trims/compresses well: **ScreenToGif** (Windows), **Kap** (macOS), **Peek** (Linux)

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the module convention every domain follows and how to add a new one.

