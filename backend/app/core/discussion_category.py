"""Infer discussion categories from post content."""

from __future__ import annotations

from app.core.discussion_constants import (
    DISCUSSION_CATEGORY_KEYWORDS,
    DiscussionCategory,
)
from app.models.post import Post


def discussion_text_blob(post: Post) -> str:
    parts = [post.title or "", post.body or ""]
    tags = post.discussion_tags if isinstance(post.discussion_tags, list) else []
    parts.extend(str(tag) for tag in tags)
    return " ".join(parts).lower()


def infer_discussion_categories(post: Post) -> list[DiscussionCategory]:
    if post.discussion_category:
        try:
            category = DiscussionCategory(post.discussion_category)
            if category != DiscussionCategory.ALL:
                return [category]
        except ValueError:
            pass
    blob = discussion_text_blob(post)
    if not blob.strip():
        return []
    matched: list[DiscussionCategory] = []
    for category, keywords in DISCUSSION_CATEGORY_KEYWORDS.items():
        if category == DiscussionCategory.ALL:
            continue
        if any(keyword in blob for keyword in keywords):
            matched.append(category)
    return matched


def post_matches_category(post: Post, category: DiscussionCategory) -> bool:
    if category == DiscussionCategory.ALL:
        return True
    return category in infer_discussion_categories(post)
