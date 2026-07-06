import type { FeedAuthor } from "@yunicity/types";

/** Lien profil citoyen depuis une carte feed — route canonique `/user/{id}`. */
export function buildFeedAuthorProfileHref(author: FeedAuthor): string | null {
  if (author.type !== "citizen") {
    return null;
  }
  return `/user/${author.id}`;
}
