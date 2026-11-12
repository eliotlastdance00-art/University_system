from pydantic import BaseModel
from typing import Annotated
from pydantic import BeforeValidator

CoercedStr = Annotated[str, BeforeValidator(lambda x: str(x) if x is not None else x)]

class Test(BaseModel):
    section_number: CoercedStr | None = None

print(Test(section_number=123).model_dump())
