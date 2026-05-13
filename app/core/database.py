import aiomysql 
from app.core.config import settings
from contextlib import asynccontextmanager


pool=None

async def pool_create():
    global pool
    pool=await aiomysql.create_pool(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        db=settings.DB_NAME,
        autocommit=False,
        minsize=1,
        maxsize=10

    )
async def close_pool():
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()


async def get_db():
    async with pool.acquire() as conn:
        yield conn

