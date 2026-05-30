"""Infer story categories from post content."""

from __future__ import annotations

from app.core.story_constants import STORY_CATEGORY_KEYWORDS, StoryCategory
from app.models.post import Post


def story_text_blob(post: Post) -> str:
    parts = [post.body or "", post.story_location_label or ""]
    tags = post.story_tags if isinstance(post.story_tags, list) else []
    parts.extend(str(tag) for tag in tags)
    return " ".join(parts).lower()


def infer_story_categories(post: Post) -> list[StoryCategory]:
    if post.story_category:
        try:
            category = StoryCategory(post.story_category)
            if category != StoryCategory.ALL:
                return [category]
        except ValueError:
            pass
    blob = story_text_blob(post)
    if not blob.strip():
        return []
    matched: list[StoryCategory] = []
    for category, keywords in STORY_CATEGORY_KEYWORDS.items():
        if category == StoryCategory.ALL:
            continue
        if any(keyword in blob for keyword in keywords):
            matched.append(category)
    return matched


def post_matches_story_category(post: Post, category: StoryCategory) -> bool:
    if category == StoryCategory.ALL:
        return True
    return category in infer_story_categories(post)
