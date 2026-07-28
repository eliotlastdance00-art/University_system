"""
University System — Application Entry Point.

Wires together:
  - Async DB pool lifecycle (lifespan)
  - CORS middleware
  - Request-context middleware (logging, request_id)
  - Centralised exception handler for AppError hierarchy
  - All domain routers
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

# ─── Router imports ─────────────────────────────────────────
from app.academic.academic_years.router import router as academic_year_router
from app.academic.assignments.router import router as assignment_router
from app.academic.attendance.router import router as attendance_router
from app.academic.cohorts.router import router as cohort_router
from app.academic.grades.router import router as grade_router
from app.academic.lessons.router import router as lesson_router
from app.academic.programs.router import router as program_router
from app.academic.sections.router import router as section_router
from app.academic.subjects.router import router as subject_router
from app.academic.timetable.router import router as timetable_router
from app.auth.router import router as auth_router
from app.core.config import settings
from app.core.database import close_pool, pool_create
from app.core.exceptions import AppError
from app.core.logger import logger
from app.core.middleware import RequestContextMiddleware
from app.department.router import router as department_router
from app.faculty.router import router as faculty_router
from app.notifications.router import router as notification_router
from app.profile.router import router as profile_router
from app.users.router import router as user_router

# ─── Lifespan ───────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting_up", extra={"context": {"version": settings.APP_VERSION}})
    await pool_create()
    yield
    await close_pool()
    logger.info("shutdown_complete")


# ─── App ────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ─── Middleware (order matters: outermost first) ────────────

app.add_middleware(RequestContextMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global Exception Handler ──────────────────────────────


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    """
    Catch any exception that inherits from AppError and return
    a consistent JSON error body.
    """
    request_id = getattr(request.state, "request_id", None)
    logger.warning(
        f"app_error: {exc.error_code}",
        extra={
            "context": {
                "detail": exc.message,
                "status_code": exc.status_code,
                "request_id": request_id,
            }
        },
    )
    body = {
        "error_code": exc.error_code,
        "detail": exc.message,
    }
    if request_id:
        body["request_id"] = request_id
    return JSONResponse(status_code=exc.status_code, content=body)


# ─── API v1 Routers ─────────────────────────────────────────

PREFIX = "/University_system/v1"

app.include_router(auth_router, prefix=f"{PREFIX}/auth", tags=["Auth"])
app.include_router(user_router, prefix=f"{PREFIX}/users", tags=["Users"])
app.include_router(faculty_router, prefix=f"{PREFIX}/faculties", tags=["Faculties"])
app.include_router(
    department_router, prefix=f"{PREFIX}/departments", tags=["Departments"]
)
app.include_router(subject_router, prefix=f"{PREFIX}/subjects", tags=["Subjects"])
app.include_router(
    assignment_router, prefix=f"{PREFIX}/assignments", tags=["Assignments"]
)
app.include_router(timetable_router, prefix=f"{PREFIX}/timetables", tags=["Timetables"])
app.include_router(lesson_router, prefix=f"{PREFIX}/lessons", tags=["Lessons"])
app.include_router(
    attendance_router, prefix=f"{PREFIX}/attendance", tags=["Attendance"]
)
app.include_router(
    academic_year_router, prefix=f"{PREFIX}/academic_years", tags=["Academic Years"]
)
app.include_router(grade_router, prefix=f"{PREFIX}/grades", tags=["Grades"])
app.include_router(section_router, prefix=f"{PREFIX}/sections", tags=["Sections"])
app.include_router(program_router, prefix=f"{PREFIX}/programs", tags=["Programs"])
app.include_router(cohort_router, prefix=f"{PREFIX}/cohorts", tags=["Cohorts"])
app.include_router(profile_router, prefix=f"{PREFIX}/profile", tags=["Profile"])
app.include_router(
    notification_router, prefix=f"{PREFIX}/notification", tags=["Notification"]
)


# ─── Health Check ───────────────────────────────────────────


@app.get("/", tags=["Health"])
async def health():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }
