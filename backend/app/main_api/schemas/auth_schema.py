from pydantic import BaseModel
from typing import Optional


class FirebaseAuthRequest(BaseModel):
    id_token: str
    nickname: Optional[str] = None
    profile_image: Optional[str] = None


class AuthUserResponse(BaseModel):
    user_id: str
    nickname: str
    profile_image: Optional[str] = None
    created_at: str


class FirebaseAuthResponse(BaseModel):
    success: bool
    is_new_user: bool
    user: AuthUserResponse
