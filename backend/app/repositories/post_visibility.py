"""Post audience visibility policy (FEED-POST-COMPOSER-01 hardening).

The composer lets citizens pick a restricted audience (followers, close
friends, custom). Until a follower / close-friends graph exists server-side,
non-public posts fail closed: only their author can read them. Every read
path returning citizen post content must apply one of these helpers.
"""

from __future__ import annotations

import uuid

from sqlalchemy import or_
from sqlalchemy.sql.elements import ColumnElement

from app.core.post_composer_constants import PostVisibility
from app.models.post import Post


def visible_posts_filter(viewer_id: uuid.UUID | None) -> ColumnElement[bool]:
    """SQL predicate: post is public, or the viewer is its author."""
    is_public = Post.post_visibility == PostVisibility.PUBLIC.value
    if viewer_id is None:
        return is_public
    return or_(is_public, Post.author_id == viewer_id)


def can_view_post(post: Post, viewer_id: uuid.UUID | None) -> bool:
    """Python-side check for single-post reads (detail, comments)."""
    if post.post_visibility == PostVisibility.PUBLIC.value:
        return True
    return viewer_id is not None and post.author_id == viewer_id
