"""Resolve feed neighborhood_summary from post graph (TICKET-602)."""

from __future__ import annotations

from app.models.neighborhood import Neighborhood
from app.models.post import Post
from app.schemas.neighborhood import FeedNeighborhoodSummary


def resolve_feed_neighborhood_summary(post: Post) -> FeedNeighborhoodSummary | None:
    """Pick the first active neighborhood in priority order — no scoring."""
    for candidate in _candidates(post):
        if candidate is not None and candidate.is_active:
            return FeedNeighborhoodSummary(
                slug=candidate.slug,
                display_name=candidate.display_name,
            )
    return None


def _candidates(post: Post) -> list[Neighborhood | None]:
    offer_hood = None
    if post.partner_offer is not None:
        offer_hood = post.partner_offer.neighborhood
    event_hood = None
    if post.local_event is not None:
        event_hood = post.local_event.neighborhood
    return [post.neighborhood, event_hood, offer_hood]
