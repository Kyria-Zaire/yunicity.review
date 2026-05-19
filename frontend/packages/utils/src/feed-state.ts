import type { FeedPost } from "@yunicity/types";

/** Mise à jour optimiste like/unlike — sans descendre sous zéro. */
export function applyFeedLikeToggle(post: FeedPost, liked: boolean): FeedPost {
  const wasLiked = post.liked_by_me;
  if (wasLiked === liked) {
    return post;
  }
  const delta = liked ? 1 : -1;
  return {
    ...post,
    liked_by_me: liked,
    like_count: Math.max(0, post.like_count + delta),
  };
}

export function mergeFeedItems(existing: FeedPost[], incoming: FeedPost[]): FeedPost[] {
  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];
  for (const item of incoming) {
    if (!seen.has(item.id)) {
      merged.push(item);
      seen.add(item.id);
    }
  }
  return merged;
}
