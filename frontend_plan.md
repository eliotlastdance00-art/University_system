# 🎓 University System — Frontend Development Plan

> **Tech Stack**: React 19 + Vite + React Router v7 + Vanilla CSS  
> **Backend**: FastAPI + aiomysql (MySQL) — `http://localhost:8000`  
> **API Prefix**: `/University_system/v1`  
> **Auth**: JWT (access_token + refresh_token) + OTP via email  
> **Token payload**: `{ sub: userId, role: "admin"|"teacher"|"student"|..., email, exp }`

---

## 📋 Progress Tracker

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Project Setup | ⬜ Not Started | Vite + React + Router + API client |
| 1 | Auth (Login + OTP) | ⬜ Not Started | Prerequisite for everything |
| 2 | Layout & Navigation | ⬜ Not Started | Sidebar, Header, Protected Routes |
| 3 | Admin: Dashboard | ⬜ Not Started | Backend endpoint + Frontend |
| 4 | Admin: User Management | ⬜ Not Started | CRUD + role assign |
| 5 | Admin: Faculty & Department | ⬜ Not Started | Structural management |
| 6 | Admin: Academic Setup | ⬜ Not Started | Programs, Cohorts, Sections, Subjects, Academic Years |
| 7 | Admin: Assignments & Timetable | ⬜ Not Started | Teacher-subject-section mapping + schedule |
| 8 | Admin: Lessons & Attendance | ⬜ Not Started | View/manage |
| 9 | Admin: Grades | ⬜ Not Started | Grade management |
| 10 | Notifications | ⬜ Not Started | Broadcast + inbox |
| 11 | Teacher Panel | ⬜ Not Started | Teacher-specific views |
| 12 | Student Panel | ⬜ Not Started | Student-specific views |

---

## Phase 0: Project Setup

### What
- `npx -y create-vite@latest ./frontend` — React + JS template
- Install dependencies: `react-router-dom`, `axios`
- Project structure:

```
frontend/
├── public/
├── src/
│   ├── api/              # API client (axios instance + interceptors)
│   │   ├── client.js     # Base axios config with auth headers
│   │   ├── auth.js       # Auth API calls
│   │   ├── users.js      # User API calls
│   │   ├── ...           # Per-domain API modules
│   ├── assets/           # Static assets, fonts
│   ├── components/       # Shared/reusable components
│   │   ├── Layout/       # AppLayout, Sidebar, Header
│   │   ├── ui/           # Button, Input, Modal, Table, Card, Badge, etc.
│   │   └── ProtectedRoute.jsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.jsx
│   ├── hooks/            # Custom hooks
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── pages/            # Route pages
│   │   ├── auth/         # LoginPage, OtpPage
│   │   ├── admin/        # Admin domain pages
│   │   ├── teacher/      # Teacher domain pages
│   │   ├── student/      # Student domain pages
│   │   └── shared/       # Profile, NotFound
│   ├── styles/           # CSS files
│   │   ├── index.css     # Design system (tokens, reset, utilities)
│   │   ├── layout.css    # Layout styles
│   │   └── components.css # Component styles
│   ├── utils/            # Helper functions
│   │   ├── token.js      # JWT decode, storage
│   │   └── constants.js  # Roles, routes
│   ├── App.jsx           # Router config
│   └── main.jsx          # Entry point
```

### Design System Tokens (in `index.css`)
- **Colors**: Dark theme with blue/purple accent palette
- **Typography**: Inter font from Google Fonts
- **Spacing**: 4px-based scale
- **Border Radius**: Consistent rounded corners
- **Shadows**: Multi-layer subtle shadows
- **Transitions**: 200ms ease standard

---

## Phase 1: Auth (Login + OTP)

### Backend Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Send email+password → triggers OTP email |
| `/auth/verify-otp` | POST | Send email+otp → receive access_token + refresh_token |
| `/auth/refresh` | POST | Refresh expired access token |
| `/auth/logout` | POST | Revoke refresh token |

### Frontend Components
1. **LoginPage** — email + password form → calls `/auth/login`
2. **OtpPage** — 6-digit OTP input → calls `/auth/verify-otp`
3. **AuthContext** — stores tokens, user info (decoded JWT), provides login/logout
4. **ProtectedRoute** — checks auth state, redirects to login if not authenticated
5. **Token Utils** — `saveTokens()`, `getAccessToken()`, `getUserFromToken()`, `clearTokens()`

### Auth Flow
```
Login → Enter email/password → POST /auth/login
  → Backend sends OTP to email
  → Redirect to OTP page
  → Enter OTP → POST /auth/verify-otp (with otp_token cookie)
  → Receive { access_token, refresh_token }
  → Decode access_token → get { sub, role, email }
  → Store tokens in localStorage
  → Redirect to role-based dashboard
```

### Role-Based Redirect After Login
| Role | Redirect To |
|------|-------------|
| admin | `/admin/dashboard` |
| teacher | `/teacher/dashboard` |
| student | `/student/dashboard` |
| dean | `/admin/dashboard` (admin-like) |

---

## Phase 2: Layout & Navigation

### Components
1. **AppLayout** — sidebar + header + main content area
2. **Sidebar** — role-based menu items, collapsible
3. **Header** — user info, notification bell (with unread count badge), logout
4. **Breadcrumbs** — current location

### Admin Sidebar Menu
```
📊 Dashboard
👥 Users
🏛️ Faculties
🏢 Departments
📚 Academic
  ├── Programs
  ├── Cohorts
  ├── Sections
  ├── Subjects
  └── Academic Years
📝 Assignments
📅 Timetable
📖 Lessons
✅ Attendance
📊 Grades
🔔 Notifications
👤 Profile
```

### Teacher Sidebar Menu
```
📊 Dashboard
📝 My Assignments
📅 My Schedule
📖 Lessons (Start/Cancel)
✅ Attendance (Take)
📊 Grades (Enter)
🔔 Notifications
👤 Profile
```

### Student Sidebar Menu
```
📊 Dashboard
📅 My Timetable
📊 My Grades
✅ My Attendance
🔔 Notifications
👤 Profile
```

---

## Phase 3: Admin Dashboard

### Backend Work Required ⚠️
Dashboard router and schemas are currently **EMPTY**. Need to create:

**New file: `app/dashboard/router.py`**
```python
# Endpoint: GET /dashboard
# Auth: get_current_user
# Returns role-specific aggregated data:
#   - Admin: total_users, total_faculties, total_departments, 
#            total_students, total_teachers, recent_notifications,
#            unread_count, active_academic_year
#   - Teacher: my_assignments_count, my_lessons_today, 
#              recent_notifications, unread_count
#   - Student: my_grades_avg, my_attendance_pct,
#              recent_notifications, unread_count
```

### Admin Dashboard Frontend Cards
- **Users Count** — total users, breakdown by role
- **Faculties** — total count
- **Departments** — total count
- **Students** — total enrolled
- **Teachers** — total
- **Active Academic Year** — current year info
- **Recent Notifications** — last 5, with unread badge
- **Quick Actions** — buttons to add user, create faculty, etc.

---

## Phase 4: Admin User Management

### Backend Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users` | GET | List all users |
| `/users` | POST | Create user |
| `/users/search` | GET | Search/filter users |
| `/users/{id}` | GET | Get user detail |
| `/users/{id}` | PATCH | Update user |
| `/users/{id}` | DELETE | Delete user |
| `/users/{user_id}/roles` | POST | Assign role |
| `/users/{user_id}/roles` | GET | List user roles |
| `/users/{user_id}/roles/{role_id}` | DELETE | Remove role |
| `/users/{user_id}/assign-section` | POST | Assign to section |

### Frontend Pages
1. **UsersListPage** — table with search/filter, pagination
2. **UserCreatePage** — form (full_name, email, password)
3. **UserDetailPage** — view + edit + role management + section assignment

---

## Phase 5: Admin Faculty & Department Management

### Faculty Endpoints
| Endpoint | Method |
|----------|--------|
| `/faculties` | GET, POST |
| `/faculties/{id}` | GET, PUT, DELETE |
| `/faculties/{id}/departments` | GET |

### Department Endpoints
| Endpoint | Method |
|----------|--------|
| `/departments/next` | GET (cursor pagination) |
| `/departments/{id}` | GET, PUT, DELETE |
| `/departments` | POST |
| `/departments/{id}/programs` | GET |
| `/departments/{id}/teachers` | GET |
| `/departments/{id}/students` | GET |

### Frontend Pages
1. **FacultiesPage** — CRUD table + departments drill-down
2. **DepartmentsPage** — CRUD table with faculty filter

---

## Phase 6: Admin Academic Setup

### Sub-modules (5 CRUD entities)
1. **Academic Years** — `/academic_years` (GET all, POST, PUT)
2. **Programs** — `/programs` (CRUD + cohorts listing)
3. **Cohorts** — `/cohorts` (CRUD + sections listing)
4. **Sections** — `/sections` (CRUD + students, timetable, attendance stats)
5. **Subjects** — `/subjects` (CRUD, by faculty/department)

### Frontend: Tab-based or nested navigation
```
/admin/academic/years
/admin/academic/programs
/admin/academic/cohorts
/admin/academic/sections
/admin/academic/subjects
```

---

## Phase 7: Admin Assignments & Timetable

### Assignment Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/assignments` | GET, POST | All / create |
| `/assignments/{id}` | GET, PUT, DELETE | Single CRUD |
| `/assignments/semester/{s}` | GET | By semester |
| `/assignments/group/{id}` | GET | By section |

### Timetable Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/timetables` | GET, POST | All / create |
| `/timetables/{id}` | PUT, DELETE | Update / delete |
| `/timetables/group/{id}` | GET | Group week |
| `/timetables/group/{id}/day/{d}` | GET | Group day |

### Frontend Pages
1. **AssignmentsPage** — teacher↔subject↔section mapping table
2. **TimetablePage** — weekly grid view, drag or form-based slot creation

---

## Phase 8: Admin Lessons & Attendance

### Lesson Endpoints (Admin view)
| Endpoint | Method |
|----------|--------|
| `/lessons` | GET |
| `/lessons/date/{date}` | GET |
| `/lessons/timetable/{id}` | GET |

### Attendance Endpoints (Admin view)
| Endpoint | Method |
|----------|--------|
| `/attendance/lesson/{id}` | GET |
| `/attendance/lesson/{id}/stats` | GET |
| `/attendance/student/{id}` | GET |
| `/attendance/student/{id}/stats` | GET |
| `/attendance/group/{id}/stats` | GET |

### Frontend Pages
1. **LessonsPage** — list with date filter
2. **AttendancePage** — per-lesson or per-student view with stats

---

## Phase 9: Admin Grades

### Endpoints
| Endpoint | Method |
|----------|--------|
| `/grades` | POST |
| `/grades/{id}` | GET, PUT, DELETE |
| `/grades/student/{id}` | GET |

### Frontend
1. **GradesPage** — by student, with create/edit/delete

---

## Phase 10: Notifications

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/notification` | GET | User's notification list |
| `/notification/{id}/read` | PATCH | Mark as read |
| `/notification/broadcast` | POST | Send broadcast |
| `/notification/register-token` | POST | Register FCM token |

### Frontend Components
1. **NotificationBell** (header) — badge with unread count, dropdown with recent
2. **NotificationsPage** — full list, mark as read
3. **BroadcastForm** (admin/dean/teacher) — send notification to target role

### Polling Strategy
- Poll `GET /notification?limit=5` every 30 seconds for unread count
- Full list on notifications page with pagination

---

## Phase 11: Teacher Panel (Future)

### Unique Endpoints
- `GET /assignments/my` — my assignments
- `GET /assignments/my/schedule` — with timetable
- `POST /lessons/{timetable_id}/start` — start lesson
- `PUT /lessons/{id}/cancel` — cancel lesson
- `GET /lessons/my/history` + `/my/stats`
- `GET /attendance/lesson/{id}/students` — get students for roll call
- `POST /attendance/lesson/{id}` — bulk attendance
- `GET /timetables/teacher/my` — my timetable

---

## Phase 12: Student Panel (Future)

### Unique Endpoints
- `GET /profile/me` — my profile
- `GET /grades/student/{my_id}` — my grades
- `GET /sections/{my_section}/timetable` — my timetable
- `GET /notification` — my notifications

---

## 🔧 Backend Changes Needed

### 1. Dashboard Endpoint (Priority: HIGH)
Create `GET /dashboard` endpoint that returns role-specific aggregated data.
Currently `router.py` and `schemas.py` are **empty**.

Need to implement:
- **Admin dashboard**: counts (users, faculties, departments, students, teachers), active academic year, recent notifications
- **Teacher dashboard**: my assignments count, today's lessons, attendance stats
- **Student dashboard**: GPA/average score, attendance percentage, upcoming classes

### 2. CORS Configuration
Ensure `.env` has `ALLOWED_ORIGINS` including `http://localhost:5173` (Vite dev server).

---

## 🎨 Design Direction

- **Theme**: Dark mode with glassmorphism cards
- **Accent**: Blue-violet gradient (`#6366f1` → `#8b5cf6`)
- **Font**: Inter (Google Fonts)
- **Cards**: Frosted glass with subtle borders
- **Tables**: Striped with hover effects
- **Animations**: Smooth page transitions, micro-interactions on hover
- **Charts**: CSS-based progress bars for stats (no heavy chart library)

---

## 📝 Implementation Order (Token-Efficient Strategy)

> **Rule**: Finish one phase completely before moving to next.
> **Rule**: Build reusable UI components in Phase 0-2, reuse everywhere after.

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → ...
Setup     Auth       Layout    Dashboard  Users      Faculty
```

Each phase deliverable:
1. API module (`src/api/xxx.js`)
2. Page components (`src/pages/xxx/`)
3. Route registration in `App.jsx`
4. CSS styles
5. Test manually → mark ✅ in tracker

---

## 🔗 Key Backend Reference

- **API Base**: `http://localhost:8000/University_system/v1`
- **Auth Header**: `Authorization: <access_token>` (no "Bearer" prefix — APIKeyHeader)
- **Token Decode**: JWT payload has `sub` (user_id), `role`, `email`, `exp`
- **Roles**: `admin`, `rector`, `prorektor`, `dean`, `department_head`, `teacher`, `student`
- **Swagger Docs**: `http://localhost:8000/docs`

---

> **Last Updated**: 2026-08-01  
> **Current Phase**: Phase 0 — Not Started  
> **Next Action**: Create Vite project + setup project structure
