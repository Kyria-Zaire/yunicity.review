import type { FeedAuthor } from "@yunicity/types";

import { buildCitizenPublicProfileHref } from "./profile-routes";

/** Lien profil citoyen depuis une carte feed. */
export function buildFeedAuthorProfileHref(author: FeedAuthor): string | null {
  if (author.type !== "citizen") {
    return null;
  }
  return buildCitizenPublicProfileHref({
    userId: author.id,
    username: author.username,
  });
}
