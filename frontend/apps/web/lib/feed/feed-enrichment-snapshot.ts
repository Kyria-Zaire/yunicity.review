export type FeedEnrichmentSnapshot<T> = {
  scopeKey: string;
  value: T;
};

export function resolveFeedEnrichmentSnapshot<T>(
  current: FeedEnrichmentSnapshot<T> | null,
  candidate: FeedEnrichmentSnapshot<T>,
  sourcesSettled: boolean,
  isSameValue?: (left: T, right: T) => boolean,
): FeedEnrichmentSnapshot<T> | null {
  if (!sourcesSettled) return current;
  if (
    current &&
    current.scopeKey === candidate.scopeKey &&
    (current.value === candidate.value ||
      (isSameValue?.(current.value, candidate.value) ?? false))
  ) {
    return current;
  }
  return candidate;
}

export function feedEnrichmentForScope<T>(
  snapshot: FeedEnrichmentSnapshot<T> | null,
  scopeKey: string,
): T | null {
  return snapshot?.scopeKey === scopeKey ? snapshot.value : null;
}

/** Compare l'enrichissement vidéo du fil sans exiger l'égalité de référence. */
export function isSameFeedVideoEnrichment(
  left: { videos: readonly { id: string }[]; families: readonly string[] },
  right: { videos: readonly { id: string }[]; families: readonly string[] },
): boolean {
  if (left.families.length !== right.families.length) return false;
  if (left.families.some((family, index) => family !== right.families[index])) return false;
  if (left.videos.length !== right.videos.length) return false;
  return left.videos.every((video, index) => video.id === right.videos[index]?.id);
}
