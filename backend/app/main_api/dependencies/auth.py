from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.main_api.services import auth_service

# 공통 Bearer 파서. auto_error=False로 두고 각 의존성에서 직접 제어한다.
bearer = HTTPBearer(auto_error=False)


def get_current_auth_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    # 인증이 필수인 API에서 사용하는 의존성
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization Bearer 토큰이 필요합니다.",
        )
    return auth_service.me_from_firebase_token(credentials.credentials)


def get_optional_auth_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    # 인증이 선택인 API(예: 익명 댓글)에서 사용하는 의존성
    if not credentials:
        return None
    return auth_service.me_from_firebase_token(credentials.credentials)
