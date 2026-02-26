import boto3
from datetime import datetime, timezone
from typing import Optional
from boto3.dynamodb.conditions import Key
from app.shared.config import settings

dynamodb = boto3.resource('dynamodb', region_name=settings.REGION)
user_table = dynamodb.Table(settings.USER_TABLE)
recipe_table = dynamodb.Table(settings.RECIPE_TABLE)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def get_user_profile(user_id: str):
    response = user_table.get_item(
        Key={"user_id": user_id}
    )
    return response.get("Item")


def upsert_user_profile(user_id: str, nickname: str, profile_image: Optional[str]):
    existing = get_user_profile(user_id)
    created_at = existing.get("created_at") if existing else _utc_now_iso()

    item = {
        "user_id": user_id,
        "nickname": nickname,
        "profile_image": profile_image,
        "created_at": created_at
    }
    user_table.put_item(Item=item)
    return item


def add_user_history(
    user_id: str,
    video_id: str,
    recipe_title: str,
    thumbnail_url: str,
    created_at: Optional[str] = None
):
    event_time = created_at or _utc_now_iso()
    item = {
        "PK": f"USER#{user_id}",
        "SK": f"HISTORY#{event_time}",
        "video_id": video_id,
        "recipe_title": recipe_title,
        "thumbnail_url": thumbnail_url,
        "created_at": event_time
    }
    recipe_table.put_item(Item=item)
    return item


def list_user_history(user_id: str, limit: int = 20):
    response = recipe_table.query(
        KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("HISTORY#"),
        ScanIndexForward=False,
        Limit=limit
    )
    return response.get("Items", [])


def list_user_activities(user_id: str, limit: int = 20):
    response = recipe_table.query(
        IndexName="UserActivityIndex",
        KeyConditionExpression=Key("user_id").eq(user_id),
        ScanIndexForward=False,
        Limit=limit
    )
    return response.get("Items", [])
