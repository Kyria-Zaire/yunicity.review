"""Map post composer ORM fields to API DTOs."""

from __future__ import annotations

import uuid

from app.core.post_composer_constants import PostFormat, PostVisibility
from app.models.post import Post
from app.schemas.post import (
    PostComposerMetaResponse,
    PostCreateRequest,
    PostCrossPostTargetsInput,
    PostMediaItemInput,
    PostMediaTypeLiteral,
    PostPollInput,
)


def _parse_uuid_list(raw: list[str] | list[object] | None) -> list[uuid.UUID]:
    if not raw:
        return []
    result: list[uuid.UUID] = []
    for item in raw:
        try:
            result.append(uuid.UUID(str(item)))
        except ValueError:
            continue
    return result


def _parse_media_urls(raw: list[dict[str, str]] | None) -> list[PostMediaItemInput]:
    if not raw:
        return []
    items: list[PostMediaItemInput] = []
    for entry in raw:
        url = entry.get("url")
        if not url:
            continue
        raw_media_type = entry.get("media_type", "image")
        media_type: PostMediaTypeLiteral = "video" if raw_media_type == "video" else "image"
        items.append(PostMediaItemInput(url=url, media_type=media_type))
    return items


def to_composer_meta_response(post: Post) -> PostComposerMetaResponse | None:
    has_composer_data = (
        post.post_visibility != PostVisibility.PUBLIC.value
        or post.post_format is not None
        or bool(post.media_urls)
        or not post.allow_comments
        or not post.allow_shares
        or post.scheduled_at is not None
        or post.location_label
        or post.activity_label
        or post.linked_tribe_id is not None
        or post.tagged_user_ids
        or post.audience_user_ids
        or post.poll_data
        or post.cross_post_targets
        or post.use_media_caption
    )
    if not has_composer_data:
        return None

    poll: PostPollInput | None = None
    if post.poll_data and isinstance(post.poll_data, dict):
        question = post.poll_data.get("question")
        options = post.poll_data.get("options")
        if isinstance(question, str) and isinstance(options, list):
            poll = PostPollInput(
                question=question,
                options=[str(item) for item in options],
            )

    cross_post: PostCrossPostTargetsInput | None = None
    if post.cross_post_targets:
        cross_post = PostCrossPostTargetsInput(
            instagram=bool(post.cross_post_targets.get("instagram")),
            tiktok=bool(post.cross_post_targets.get("tiktok")),
            facebook=bool(post.cross_post_targets.get("facebook")),
            twitter=bool(post.cross_post_targets.get("twitter")),
        )

    visibility = PostVisibility(post.post_visibility)
    post_format = PostFormat(post.post_format) if post.post_format else None

    return PostComposerMetaResponse(
        visibility=visibility,
        post_format=post_format,
        media_urls=_parse_media_urls(post.media_urls),
        allow_comments=post.allow_comments,
        allow_shares=post.allow_shares,
        scheduled_at=post.scheduled_at,
        location_label=post.location_label,
        activity_label=post.activity_label,
        linked_tribe_id=post.linked_tribe_id,
        tagged_user_ids=_parse_uuid_list(post.tagged_user_ids),
        audience_user_ids=_parse_uuid_list(post.audience_user_ids),
        poll=poll,
        cross_post_targets=cross_post,
        use_media_caption=post.use_media_caption,
    )


def apply_composer_create_payload(post: Post, payload: PostCreateRequest) -> None:
    """Persist composer fields from PostCreateRequest onto a new Post."""
    post.post_visibility = payload.visibility.value
    post.post_format = payload.post_format.value if payload.post_format else None
    post.allow_comments = payload.allow_comments
    post.allow_shares = payload.allow_shares
    post.scheduled_at = payload.scheduled_at
    post.location_label = payload.location_label
    post.activity_label = payload.activity_label
    post.linked_tribe_id = payload.linked_tribe_id
    post.use_media_caption = payload.use_media_caption
    post.tagged_user_ids = [str(item) for item in payload.tagged_user_ids]
    post.audience_user_ids = [str(item) for item in payload.audience_user_ids]

    media_items = payload.media_urls
    if media_items:
        post.media_urls = [
            {"url": item.url, "media_type": item.media_type} for item in media_items
        ]
        post.media_url = media_items[0].url
    elif payload.media_url:
        post.media_url = payload.media_url
        post.media_urls = [{"url": payload.media_url, "media_type": "image"}]

    if payload.poll is not None:
        post.poll_data = {
            "question": payload.poll.question,
            "options": payload.poll.options,
        }

    if payload.cross_post_targets is not None:
        post.cross_post_targets = payload.cross_post_targets.model_dump()

    if payload.scheduled_at is not None:
        post.is_active = False
