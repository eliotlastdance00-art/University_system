from app.academic.grades.repository import AuditLogRepository, GradeRepository
from app.academic.grades.schemas import GradeCreate, GradeUpdate
from app.academic.grades.exceptions import GradeNotFoundError, InvalidGradeValueError
from app.core.logger import logger


class GradeService:
    def __init__(self, conn):
        self.conn = conn
        self.grade_repo = GradeRepository(conn)
        self.audit_repo = AuditLogRepository(conn)

    async def create_grade(self, data: GradeCreate, current_user: dict):
        if data.score > data.max_score or data.score < 0:
            raise InvalidGradeValueError("Score must be between 0 and max_score")

        try:
            # Transaction is managed by get_db dependency. We execute both queries.
            # If one fails, the Exception is propagated, caught by get_db, and rollback is performed.
            grade_id = await self.grade_repo.create(data, current_user["sub"])
            new_grade = await self.grade_repo.get_by_id(grade_id)

            await self.audit_repo.log_action(
                actor_id=int(current_user["sub"]),
                action="CREATE",
                entity_name="grades",
                entity_id=grade_id,
                old_value=None,
                new_value=new_grade,
            )

            logger.info(
                "Grade created successfully",
                extra={
                    "extra_context": {
                        "grade_id": grade_id,
                        "actor_id": current_user["sub"],
                    }
                },
            )



            return new_grade
        except Exception as e:
            logger.error(f"Failed to create grade: {e!s}")
            raise 

    async def update_grade(self, grade_id: int, data: GradeUpdate, current_user: dict):
        old_grade = await self.grade_repo.get_by_id(grade_id)
        if not old_grade:
            raise GradeNotFoundError(f"Grade with id {grade_id} not found")

        updates = data.model_dump(exclude_unset=True)
        if updates:
            score = updates.get("score", old_grade["score"])
            max_score = updates.get("max_score", old_grade["max_score"])
            if score > max_score or score < 0:
                raise InvalidGradeValueError("Score must be between 0 and max_score")

            try:
                await self.grade_repo.update(grade_id, updates)
                new_grade = await self.grade_repo.get_by_id(grade_id)

                await self.audit_repo.log_action(
                    actor_id=int(current_user["sub"]),
                    action="UPDATE",
                    entity_name="grades",
                    entity_id=grade_id,
                    old_value=old_grade,
                    new_value=new_grade,
                )

                logger.info(
                    "Grade updated successfully",
                    extra={
                        "extra_context": {
                            "grade_id": grade_id,
                            "actor_id": current_user["sub"],
                        }
                    },
                )


                return new_grade
            except Exception as e:
                logger.error(f"Failed to update grade: {e!s}")
                raise 
        return old_grade

    async def delete_grade(self, grade_id: int, current_user: dict):
        old_grade = await self.grade_repo.get_by_id(grade_id)
        if not old_grade:
            raise GradeNotFoundError(f"Grade with id {grade_id} not found")

        try:
            await self.grade_repo.delete(grade_id)

            await self.audit_repo.log_action(
                actor_id=int(current_user["sub"]),
                action="DELETE",
                entity_name="grades",
                entity_id=grade_id,
                old_value=old_grade,
                new_value=None,
            )

            logger.info(
                "Grade deleted successfully",
                extra={
                    "extra_context": {
                        "grade_id": grade_id,
                        "actor_id": current_user["sub"],
                    }
                },
            )
        except Exception as e:
            logger.error(f"Failed to delete grade: {e!s}")
            raise 

    async def get_grade(self, grade_id: int):
        grade = await self.grade_repo.get_by_id(grade_id)
        if not grade:
            raise GradeNotFoundError(f"Grade with id {grade_id} not found")
        return grade

    async def get_grades_for_student(self, student_id: int):
        return await self.grade_repo.get_by_student(student_id)
