from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.database import pool_create,close_pool
from app.faculty.router import router as faculty_router
from app.department.router import router as department_router
from app.groups.router import router as group_router
from app.users.router import router as user_router
from app.auth.router import router as auth_router
from app.acedemic.subjects.router import router as subject_router
@asynccontextmanager
async def lifespan(app:FastAPI):
    await pool_create()
    yield
    await close_pool()


app=FastAPI(title="University System",lifespan=lifespan)

app.include_router(faculty_router)   
app.include_router(department_router)    
app.include_router(group_router) 
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(subject_router)



@app.get("/")
async def home():
    return {"message":"Hello Admin"}
    