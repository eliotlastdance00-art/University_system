from app.core.audit_log import AuditAction, AuditLogger
from app.department.exceptions import DepartmentNotFoundError
from app.department.repository import DepartmentRepository
from app.faculty.exceptions import FacultyNotFoundError
from app.faculty.repository import FacultyRepository

from .exceptions import SubjectAlreadyExistsError, SubjectNotFoundError
from .repository import SubjectRepository
from .schemas import SubjectCreate, SubjectResponse, SubjectUpdate


class SubjectService:
    def __init__(self, conn):
        self.conn = conn
        self.repo = SubjectRepository(conn)
        self.dept_repo = DepartmentRepository(conn)
        self.fac_repo = FacultyRepository(conn)
        self.audit = AuditLogger(conn)

    async def get_or_404(self, id: int) -> dict:
        subject = await self.repo.get_id_subjects(id)
        if not subject:
            raise SubjectNotFoundError()
        return subject

    #         CREATE_SUBJECT
    async def create_subject(
        self, data: SubjectCreate, actor_id: int | None = None
    ) -> SubjectResponse:
        department = await self.dept_repo.get_department_by_id(data.department_id)
        if not department:
            raise DepartmentNotFoundError()

        name = await self.repo.get_name_subjects(data.name, data.department_id)
        if name:
            raise SubjectAlreadyExistsError()

        new_id = await self.repo.create_subject(
            data.name, data.credits, data.department_id
        )
        subject = await self.repo.get_id_subjects(new_id)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.CREATE,
            entity_name="subject",
            entity_id=new_id,
            old_value=None,
            new_value=dict(subject),
        )
        return SubjectResponse(**subject)

    #         UPDATE SUBJECT
    async def update_subject(
        self, data: SubjectUpdate, id: int, actor_id: int | None = None
    ):
        subject = await self.get_or_404(id)

        new_name = data.name or subject["name"]
        new_credits = data.credits or subject["credits"]
        new_department = data.department_id or subject["department_id"]

        if data.name and data.name != subject["name"]:
            existing = await self.repo.get_name_subjects(new_name, new_department)
            if existing:
                raise SubjectAlreadyExistsError()

        await self.repo.update_subject(id, new_name, new_credits, new_department)
        updated = await self.get_or_404(id)

        await self.audit.log(
            actor_id=actor_id,
            action=AuditAction.UPDATE,
            entity_name="subject",
            entity_id=id,
            old_value=dict(subject),
            new_value=dict(updated),
        )
        return {"message": "Changed Subject ✅"}

    #         GET ALL SUBJECT
    async def get_all_subject(self):
        subject = await self.repo.get_all_subjects()
        return [SubjectResponse(**s) for s in subject]

    #       GET ALL SUBJECT FACULTY
    async def get_subject_faculty_all(self, faculty_id: int) -> list[SubjectResponse]:
        faculty = await self.fac_repo.get_faculty_by_id(faculty_id)
        if not faculty:
            raise FacultyNotFoundError()
        subject = await self.repo.get_all_subjects_faculty(faculty_id)
        return [SubjectResponse(**s) for s in subject]

    #       GET ALL SUBJECT DEPARTMENT
    async def get_subject_department_all(self, department_id: int):
        department = await self.dept_repo.get_department_by_id(department_id)
        if not department:
            raise DepartmentNotFoundError()
        subject = await self.repo.get_all_subjects_department(department_id)
        return [SubjectResponse(**s) for s in subject]

    #     GET SUBJECT ID
    async def get_subject_id(self, id: int):
        return await self.get_or_404(id)
