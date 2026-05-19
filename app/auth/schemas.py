from pydantic import BaseModel,EmailStr
from datetime import datetime

class LoginRequest(BaseModel):
    email:EmailStr
    password:str


class TokenResponse(BaseModel):
    access_token:str
    refresh_token:str
    token_type:str="bearer"



class SaveRefreshToken(BaseModel):
    user_id:int
    token:str
    expires_at:datetime  
    is_revoked:False
      