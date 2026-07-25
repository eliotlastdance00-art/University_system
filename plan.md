# University System - Action Plan

## Phase 1: Stabilization & Bug Fixing
**Objective**: Fix immediate runtime errors and logic flaws.
1. Resolve the `update_user` password hashing bug.
2. Resolve the `assign_section` role ID type-mismatch bug.
3. Review all other repository methods to ensure SQL parameters match their expected types.
4. Verify database constraints (Foreign Keys, Unique fields).

## Phase 2: Architectural Refactoring
**Objective**: Prepare the codebase for scalability and testing.
1. Implement a centralized `Role` enum to replace magic strings.
2. Refactor `app.core.dependencies` to inject repository instances into the services.
3. Review and refine the `get_db` context manager in `app/core/database.py` to ensure robust error handling and connection pooling lifecycle.

## Phase 3: Testing & Quality Assurance
**Objective**: Prevent future regressions.
1. Set up `pytest` and `pytest-asyncio`.
2. Write unit tests for `auth` and `users` modules first, as they are foundational.
3. Write API tests for `timetable` and `academic` endpoints.
4. Introduce code linting (Ruff, Black) and typing checks (mypy).

## Phase 4: Feature Completion & Deployment
**Objective**: Finish remaining modules and prepare for production.
1. Complete endpoints for grading, attendance, and assignments.
2. Create Dockerfile and `docker-compose.yml` for application and MySQL database.
3. Implement CI/CD pipeline (e.g., GitHub Actions) for running tests and building images.
