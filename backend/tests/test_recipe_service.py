import pytest

from fastapi import HTTPException

from app.main_api.services import recipe_service


def test_create_comment_anonymous_with_uid(monkeypatch):
    captured = {}

    def fake_get_or_create_anonymous_number(video_id, anon_uid):
        assert video_id == "vid1"
        assert anon_uid == "anonuid123"
        return 7

    def fake_create_comment(*, video_id, user_id, nickname, content, like_count, is_anonymous, anonymous_number=None):
        captured.update(
            {
                "video_id": video_id,
                "user_id": user_id,
                "nickname": nickname,
                "content": content,
                "like_count": like_count,
                "is_anonymous": is_anonymous,
                "anonymous_number": anonymous_number,
            }
        )
        return captured

    monkeypatch.setattr(recipe_service.recipe_repo, "get_or_create_anonymous_number", fake_get_or_create_anonymous_number)
    monkeypatch.setattr(recipe_service.recipe_repo, "create_comment", fake_create_comment)

    result = recipe_service.create_comment(
        video_id="vid1",
        content="hi",
        like_count=0,
        user_id="anonuid123",
        nickname=None,
        is_anonymous=True,
    )

    assert result["is_anonymous"] is True
    assert result["anonymous_number"] == 7
    assert result["nickname"] == "익명7"
    assert result["user_id"] == "anonuid123"


def test_create_comment_anonymous_without_uid(monkeypatch):
    captured = {}

    def fake_get_or_create_anonymous_number(video_id, anon_uid):
        assert anon_uid is None
        return 3

    def fake_create_comment(*, video_id, user_id, nickname, content, like_count, is_anonymous, anonymous_number=None):
        captured.update(
            {
                "video_id": video_id,
                "user_id": user_id,
                "nickname": nickname,
                "content": content,
                "like_count": like_count,
                "is_anonymous": is_anonymous,
                "anonymous_number": anonymous_number,
            }
        )
        return captured

    monkeypatch.setattr(recipe_service.recipe_repo, "get_or_create_anonymous_number", fake_get_or_create_anonymous_number)
    monkeypatch.setattr(recipe_service.recipe_repo, "create_comment", fake_create_comment)

    result = recipe_service.create_comment(
        video_id="vid2",
        content="anon",
        like_count=0,
        user_id=None,
        nickname=None,
        is_anonymous=True,
    )

    assert result["is_anonymous"] is True
    assert result["anonymous_number"] == 3
    assert result["nickname"] == "익명3"
    assert result["user_id"] == "ANON#3"


def test_create_comment_requires_auth_for_non_anonymous():
    with pytest.raises(HTTPException) as exc:
        recipe_service.create_comment(
            video_id="vid3",
            content="hi",
            like_count=0,
            user_id=None,
            nickname=None,
            is_anonymous=False,
        )
    assert exc.value.status_code == 400


def _patch_ingredient_search(monkeypatch, index):
    infos = {
        vid: {"video_id": vid, "title": f"title-{vid}", "ingredients": [{"normalized_names": ["소금"]}]}
        for vid in {v for ids in index.values() for v in ids}
    }
    monkeypatch.setattr(recipe_service.recipe_repo, "get_ingredient_index", lambda name: index.get(name, []))
    monkeypatch.setattr(
        recipe_service.recipe_repo,
        "batch_get_recipes_info",
        lambda ids: [dict(infos[i]) for i in ids if i in infos],
    )


def test_search_by_ingredients_returns_near_recipes_with_missing_ingredient(monkeypatch):
    _patch_ingredient_search(
        monkeypatch,
        {"양파": ["v1", "v2", "v3"], "돼지고기": ["v1", "v2"], "대파": ["v1"]},
    )

    result = recipe_service.search_recipes_by_ingredients(["양파", "돼지고기", "대파"])

    assert [r["video_id"] for r in result["recipes"]] == ["v1"]
    assert [r["video_id"] for r in result["near_recipes"]] == ["v2"]
    assert result["near_recipes"][0]["missing_ingredient"] == "대파"
    assert "ingredients" not in result["near_recipes"][0]


def test_search_by_ingredients_near_recipes_when_no_exact_match(monkeypatch):
    _patch_ingredient_search(monkeypatch, {"양파": ["v1", "v2"], "대파": ["v1"]})

    result = recipe_service.search_recipes_by_ingredients(["양파", "대파", "없는재료"])

    assert result["recipes"] == []
    assert [r["video_id"] for r in result["near_recipes"]] == ["v1"]
    assert result["near_recipes"][0]["missing_ingredient"] == "없는재료"


def test_search_by_ingredients_single_ingredient_has_no_near_recipes(monkeypatch):
    _patch_ingredient_search(monkeypatch, {"양파": ["v1", "v2"]})

    result = recipe_service.search_recipes_by_ingredients(["양파"])

    assert len(result["recipes"]) == 2
    assert result["near_recipes"] == []
