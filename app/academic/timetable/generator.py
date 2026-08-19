import asyncio
from app.academic.timetable.repository import TimetableRepository

async def run_timetable_generation(conn, task_id: int, parameters: dict):
    """
    Dummy generator for testing the worker queue.
    We will write the actual CSP algorithm here in Stage 4.
    """
    repo = TimetableRepository(conn)
    
    # 1. Update status to PROCESSING
    await repo.update_task_status(task_id, "PROCESSING")
    
    # 2. Simulate heavy computation
    print(f"[Task {task_id}] Generating timetable...")
    await asyncio.sleep(5)  # Simulate 5 seconds of work
    
    # 3. Simulate creating a draft
    print(f"[Task {task_id}] Creating drafts...")
    # NOTE: assignment_id, day, start_time, end_time, room must be valid based on your DB!
    # For a real dummy run, you might want to fetch an actual assignment_id.
    # Since this is a skeleton, we just update status to COMPLETED for now.
    
    await repo.update_task_status(task_id, "COMPLETED")
    print(f"[Task {task_id}] Done.")
