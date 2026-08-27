export type FeedEnrichmentSnapshot<T> = {
  scopeKey: string;
  value: T;
};

export function resolveFeedEnrichmentSnapshot<T>(
  current: FeedEnrichmentSnapshot<T> | null,
  candidate: FeedEnrichmentSnapshot<T>,
  sourcesSettled: boolean,
): FeedEnrichmentSnapshot<T> | null {
  return sourcesSettled ? candidate : current;
}

export function feedEnrichmentForScope<T>(
  snapshot: FeedEnrichmentSnapshot<T> | null,
  scopeKey: string,
): T | null {
  return snapshot?.scopeKey === scopeKey ? snapshot.value : null;
}
