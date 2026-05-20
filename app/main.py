from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.academic.academic_years.router import router as academic_year_router
from app.academic.assignments.router import router as assignment_router
from app.academic.attendance.router import router as attendance_router
from app.academic.lessons.router import router as lesson_router
from app.academic.sections.router import router as section_router
from app.academic.subjects.router import router as subject_router
from app.academic.timetable.router import router as timetable_router
from app.auth.router import router as auth_router
from app.core.database import close_pool, pool_create
from app.department.router import router as department_router
from app.faculty.router import router as faculty_router
from app.users.router import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await pool_create()
    yield
    await close_pool()


app = FastAPI(title="University System", lifespan=lifespan)


app.include_router(auth_router, prefix="/University_system/v1/auth", tags=["Auth"])
app.include_router(
    faculty_router, prefix="/University_system/v1/faculties", tags=["Faculties"]
)
app.include_router(
    department_router, prefix="/University_system/v1/departments", tags=["Departments"]
)

app.include_router(user_router, prefix="/University_system/v1/users", tags=["Users"])

app.include_router(
    subject_router, prefix="/University_system/v1/subjects", tags=["Subjects"]
)
app.include_router(
    assignment_router, prefix="/University_system/v1/assignments", tags=["Assignments"]
)
app.include_router(
    timetable_router, prefix="/University_system/v1/timetables", tags=["Timetables"]
)

app.include_router(
    lesson_router, prefix="/University_system/v1/lessons", tags=["Lessons"]
)
app.include_router(
    attendance_router, prefix="/University_system/v1/attendance", tags=["Attendance"]
)
app.include_router(
    academic_year_router,
    prefix="/University_system/v1/academic_years",
    tags=["Academic Years"],
)

app.include_router(
    section_router, prefix="/University_system/v1/sections", tags=["Sections"]
)
app.include_router(
    section_router, prefix="/University_system/v1/programs", tags=["Programs"]
)


@app.get("/")
async def home():
    return {
        "app": "University System",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }
