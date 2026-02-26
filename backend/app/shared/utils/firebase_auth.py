import base64
import json
from functools import lru_cache

import firebase_admin
from firebase_admin import auth, credentials

from app.shared.config import settings


def _parse_service_account(raw: str) -> dict:
    # 1) raw JSON 문자열, 2) base64(JSON) 둘 다 지원
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        decoded = base64.b64decode(raw).decode("utf-8")
        data = json.loads(decoded)

    if "private_key" in data:
        data["private_key"] = data["private_key"].replace("\\n", "\n")
    return data


@lru_cache(maxsize=1)
def get_firebase_app():
    raw = settings.FIREBASE_SERVICE_ACCOUNT
    if not raw:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT 환경변수가 설정되지 않았습니다.")

    cred_dict = _parse_service_account(raw)
    cred = credentials.Certificate(cred_dict)

    if firebase_admin._apps:
        return firebase_admin.get_app()
    return firebase_admin.initialize_app(cred)


def verify_firebase_id_token(id_token: str) -> dict:
    get_firebase_app()
    return auth.verify_id_token(id_token)

