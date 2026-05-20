"""Map Post ORM to API feed/post DTOs (TICKET-402)."""

from __future__ import annotations

from app.core.flash_offer import build_flash_snapshot
from app.models.post import Post
from app.schemas.feed import (
    FeedAuthor,
    FeedEventMeta,
    FeedLocation,
    FeedOfferMeta,
    FeedPostItem,
)
from app.schemas.post import PostResponse


def _event_meta(post: Post) -> FeedEventMeta | None:
    if post.local_event_id is None or post.local_event is None:
        return None
    event = post.local_event
    return FeedEventMeta(
        local_event_id=post.local_event_id,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        location_name=event.location_name,
        district=event.district,
        event_type=event.event_type,
    )


def _offer_meta(post: Post) -> FeedOfferMeta | None:
    if post.partner_offer_id is None or post.partner_offer is None:
        return None
    offer = post.partner_offer
    flash = build_flash_snapshot(offer)
    return FeedOfferMeta(
        partner_offer_id=post.partner_offer_id,
        valid_from=offer.valid_from,
        valid_until=offer.valid_until,
        offer_type=offer.offer_type,
        is_flash=flash.is_flash,
        flash_ends_at=flash.flash_ends_at,
        remaining_hours=flash.remaining_hours,
        remaining_minutes=flash.remaining_minutes,
    )


def _location(post: Post) -> FeedLocation | None:
    point = post.location_point
    if point is None:
        return None
    return FeedLocation(latitude=point["latitude"], longitude=point["longitude"])


def to_feed_item(
    post: Post,
    *,
    author: FeedAuthor,
    liked_by_me: bool,
) -> FeedPostItem:
    return FeedPostItem(
        id=post.id,
        type=post.type,
        author=author,
        city=post.city,
        title=post.title,
        body=post.body,
        media_url=post.media_url,
        location=_location(post),
        like_count=post.like_count,
        comment_count=post.comment_count,
        liked_by_me=liked_by_me,
        offer=_offer_meta(post),
        event=_event_meta(post),
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


def to_post_response(
    post: Post,
    *,
    author: FeedAuthor,
    liked_by_me: bool,
) -> PostResponse:
    return PostResponse(
        id=post.id,
        type=post.type,
        author=author,
        city=post.city,
        title=post.title,
        body=post.body,
        media_url=post.media_url,
        location=_location(post),
        like_count=post.like_count,
        comment_count=post.comment_count,
        is_active=post.is_active,
        liked_by_me=liked_by_me,
        offer=_offer_meta(post),
        event=_event_meta(post),
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


def city_priority_for_post(post: Post, user_city: str | None) -> int:
    if not user_city or not post.city:
        return 0
    return 1 if post.city.strip().lower() == user_city.strip().lower() else 0
