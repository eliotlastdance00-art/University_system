# 📊 Admin Dashboard — Implementation Plan

## Current State Analysis

### ✅ What Exists
- **Backend scaffolding**: `app/dashboard/` — router, service, repository, schemas
- **Frontend component**: `AdminDashboard.jsx` — stat cards + notifications UI
- **Problem**: Backend returns **hardcoded mock data** (142 users, 5 faculties, etc.)

### ❌ What's Missing
- Real database queries for dashboard statistics
- Active academic year info
- Role distribution breakdown
- Recent activity / audit log display
- Proper role-based dashboard routing (admin vs teacher vs student)
- Security: admin-only guard on admin dashboard endpoint

---

## 🗄️ Database Tables Available

| Table | Key Columns | Dashboard Use |
|-------|-------------|---------------|
| `users` | id, full_name, email, is_active | Total users count |
| `roles` | id, name | Role list |
| `user_roles` | user_id, role_id | Count by role (students, teachers) |
| `user_profiles` | user_id, faculty_id, department_id, section_id | Profile data |
| `faculties` | id, name, code | Total faculties count |
| `departments` | id, name, faculty_id | Total departments count |
| `sections` | id, number, capacity | Total sections, capacity info |
| `academic_years` | id, year_start, year_end, is_active | Active year display |
| `subjects` | id, name | Total subjects count |
| `subject_assignments` | user_id, subject_id, section_id, semester | Assignment stats |
| `lessons` | id, timetable_id, date, status | Today's/recent lessons |
| `attendance` | lesson_id, user_id, status | Attendance rates |
| `grades` | student_id, subject_id, score | Grade averages |
| `notification_log` | receiver_id, title, body, is_read | Notifications |
| `audit_logs` | actor_id, action, entity_name, timestamp | Recent activity |

---

## 🏗️ Implementation Plan

### Phase 1: Backend — Real Dashboard Data

#### 1.1 Update `app/dashboard/repository.py`

Add new query methods:

```python
# Counts
async def get_total_users(conn) -> int
async def get_total_students(conn) -> int  
async def get_total_teachers(conn) -> int
async def get_total_faculties(conn) -> int
async def get_total_departments(conn) -> int
async def get_total_sections(conn) -> int
async def get_total_subjects(conn) -> int

# Rich data
async def get_active_academic_year(conn) -> dict | None
async def get_role_distribution(conn) -> list[dict]  # [{role: "student", count: 120}, ...]
async def get_recent_audit_logs(conn, limit=10) -> list[dict]
async def get_today_lessons_count(conn) -> int
async def get_overall_attendance_rate(conn) -> float
```

#### 1.2 Update `app/dashboard/schemas.py`

```python
class AcademicYearMinimal(BaseModel):
    id: int
    year_start: int
    year_end: int
    is_active: bool

class RoleDistribution(BaseModel):
    role: str
    count: int

class AuditLogMinimal(BaseModel):
    id: int
    action: str
    entity_name: str
    entity_id: int
    timestamp: datetime

class AdminDashboardResponse(DashboardBaseResponse):
    total_users: int
    total_faculties: int
    total_departments: int
    total_students: int
    total_teachers: int
    total_sections: int
    total_subjects: int
    active_academic_year: AcademicYearMinimal | None
    role_distribution: list[RoleDistribution]
    recent_activity: list[AuditLogMinimal]
    today_lessons_count: int
    overall_attendance_rate: float
```

#### 1.3 Update `app/dashboard/service.py`

- Fetch all real counts from repository
- Assemble into AdminDashboardResponse

#### 1.4 Update `app/dashboard/router.py`

- Add `admin_required` guard (currently uses `get_current_user` — any role can access)
- Return proper role-based response

### Phase 2: Security

- Dashboard endpoint MUST check role
- Admin → full stats
- Other roles → appropriate subset (future)
- Use `admin_required` dependency for admin dashboard

---

## 📋 Task Checklist

- [x] **Backend**: Add real count queries to `repository.py`
- [x] **Backend**: Update schemas with rich response models
- [x] **Backend**: Update service to fetch real data
- [x] **Backend**: Add `admin_or_dean` guard to router
- [ ] **Backend**: Test endpoint returns real data

---

> **Priority**: Backend first, then verify frontend works with real data
### 🎯 Users Page Özellikleri

  • 📋 Tablo — ID, avatar (isim baş harfi), ad, email, status badge (Active/Inactive)
  • 🔍 Search — İsim veya email ile anlık arama
  • 🔽 Filters — Status filtresi (All / Active / Inactive)
  • ➕ Create — Modal ile yeni user oluşturma (validation ile)
  • ✏️ Edit — Modal ile user düzenleme (password opsiyonel, status toggle)
  • 🗑️ Delete — Onay modalı ile silme
  • 🛡️ Role Management — Her user için modal ile rol ekleme/çıkarma (admin, dean, teacher, student)
  • 🔄 Refresh — Manual refresh butonu
  • 🍞 Toast — İşlem sonuçları için bildirimler
  • 💀 Skeleton — Loading state
  • 📱 Responsive — Mevcut grid responsive sistemi kullanıyor

  Dashboard da zaten önceki adımda güncellenmişti. Artık hem Dashboard hem Users sayfası tam çalışır durumda.
