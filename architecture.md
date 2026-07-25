# University Management System - Architecture

## Overview
The project is built using a modern, asynchronous Python stack, strictly adhering to the principles of **Clean Architecture** and the **Service Layer** design pattern. 

## Technology Stack
- **Framework**: FastAPI (asynchronous HTTP routing and dependency injection)
- **Database**: MySQL, utilizing `aiomysql` for async database connectivity.
- **Validation**: Pydantic for data validation (`schemas.py`).
- **Security**: JWT-based authentication.

## Directory and Layer Structure
The codebase is divided into modular domains under the `app/` directory (e.g., `auth`, `users`, `academic`, `faculty`, `department`). Each module generally consists of four main files:
1. **`router.py` (Controller Layer)**: Handles HTTP requests, extracts parameters, uses dependencies for authentication, and passes data to the service layer.
2. **`service.py` (Business Logic Layer)**: Contains core business rules. It orchestrates calls to the repository layer, handles logical checks (e.g., checking if a user exists), and raises `HTTPException` if business rules fail.
3. **`repository.py` (Data Access Layer)**: Contains raw `aiomysql` queries (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). Encapsulates all SQL syntax.
4. **`schemas.py` (Data Transfer Objects)**: Pydantic models for incoming request bodies and outgoing responses.

## Architectural Shortcomings & Vulnerabilities
1. **Repository Instantiation**: Currently, repositories are instantiated directly within the service layer (e.g., `self.repo = UsersRepository(self.conn)` in `users/service.py`). This tight coupling makes unit testing difficult (mocking the repository requires patching rather than simple dependency injection).
2. **No ORM (Object-Relational Mapping)**: The system relies completely on raw SQL queries via `aiomysql`. While performant, maintaining large queries across multiple tables (like in `UsersRepository.search_users`) is error-prone and scales poorly.
3. **Transaction Management**: The `get_db` dependency handles commit/rollback logic nicely, but complex transactions spanning multiple repository methods within a service must be carefully managed to avoid partial commits.
4. **Hardcoded Role IDs and Role Lookups**: String identifiers are sometimes passed to methods expecting integers (e.g., `"student"` passed to a role checking function), highlighting a lack of centralized enumerations for system roles.

## Grade Feature Design
The new Grade feature will be implemented under the `app/academic/grades/` module.
- **Controller Layer (`router.py`)**: Endpoints for creating, updating, deleting, and retrieving grades.
- **Service Layer (`service.py`)**: Business logic (e.g., ensuring a student is enrolled before grading). Will enforce transaction safety.
- **Data Access Layer (`repository.py`)**: `GradeRepository` and `AuditLogRepository`. Writes to `grades` and `audit_logs` will be wrapped in a single transaction.
- **DTOs (`schemas.py`)**: Pydantic models for Grade requests/responses.
- **Notifications**: Integrated into the service layer, failing gracefully without rolling back grades.
- **Exception Handling**: Custom exceptions like `GradeNotFoundError` will be handled globally.
