from pydantic import BaseModel, EmailStr, Field, model_validator

UPDATABLE_FIELDS = {"name", "email", "faculty_id", "department_id", "section_id"}


class UpdateProfile(BaseModel):
    id: int
    name: str | None = None
    email: EmailStr | None = None
    faculty_id: int | None = None
    department_id: int | None = None
    section_id: int | None = None

    @model_validator(mode="after")
    def _validate_update(self):
        sent = self.model_fields_set & UPDATABLE_FIELDS

        if not sent:
            raise ValueError(
                "At least one field (besides id) must be provided to update."
            )

        nulled = {f for f in sent if getattr(self, f) is None}
        if nulled:
            raise ValueError(
                f"These fields cannot be set to null: {', '.join(sorted(nulled))}"
            )

        return self


class UpdatePassword(BaseModel):
    new_password: str = Field(..., min_length=8)
