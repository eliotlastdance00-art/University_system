from collections.abc import Sequence
from typing import Any, ClassVar

import aiomysql
from arq.connections import RedisSettings

from app.academic.timetable.generator import run_timetable_generation
from app.core.config import settings


async def startup(ctx):
    """
    Worker starts up: Connect to MySQL pool.
    """
    print("Worker starting up...")
    ctx["pool"] = await aiomysql.create_pool(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        db=settings.DB_NAME,
        autocommit=False,
        minsize=1,
        maxsize=5,
    )
    print("Connected to database.")


async def shutdown(ctx):
    """
    Worker shuts down: Close MySQL pool.
    """
    print("Worker shutting down...")
    pool = ctx.get("pool")
    if pool:
        pool.close()
        await pool.wait_closed()
    print("Disconnected from database.")


async def generate_timetable_task(ctx, task_id: int, parameters: dict):
    """
    The background task to generate the timetable.
    """
    print(f"Starting timetable generation for task_id: {task_id}")
    pool = ctx["pool"]
    async with pool.acquire() as conn:
        try:
            await run_timetable_generation(conn, task_id, parameters)
            await conn.commit()
        except Exception as e:
            await conn.rollback()
            print(f"Error in task {task_id}: {e}")
            raise
    print(f"Completed timetable generation for task_id: {task_id}")


class WorkerSettings:
    functions: ClassVar[Sequence[Any]] = [generate_timetable_task]
    redis_settings = RedisSettings(host=settings.REDIS_HOST, port=settings.REDIS_PORT)
    on_startup = startup
    on_shutdown = shutdown
