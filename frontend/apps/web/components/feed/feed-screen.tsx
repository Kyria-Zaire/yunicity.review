"use client";

import type { FeedReportReason } from "@yunicity/types";
import { FEED_LOAD_MORE_LABEL } from "@yunicity/utils";
import { useEffect, useState } from "react";

import { FeedHomeHeader } from "@/components/home/feed-home-header";
import { FeedHomeRightRail } from "@/components/home/feed-home-right-rail";
import { TribeDiscoveryCard } from "@/components/home/tribe-discovery-card";
import { FeedCard } from "@/components/feed/feed-card";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedEmptyState } from "@/components/feed/feed-empty-state";
import { FeedErrorState } from "@/components/feed/feed-error-state";
import { FeedLoadingState } from "@/components/feed/feed-loading-state";
import { WebAppShell } from "@/components/layout";
import { useFeedHomeContext } from "@/hooks/use-feed-home-context";
import { useFeed } from "@/hooks/use-feed";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export function FeedScreen() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const homeContext = useFeedHomeContext();
  const feed = useFeed();
  const [reportMessage, setReportMessage] = useState<string | null>(null);

  const { loadInitial, refresh, loadMore, items, isLoading, error, nextCursor, isLoadingMore, createPost, toggleLike } =
    feed;

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function handleCreate(body: string, mediaUrl?: string | null) {
    await createPost(body, mediaUrl);
  }

  async function handleReport(postId: string, reason: FeedReportReason) {
    await api.reportFeedPost(postId, { reason });
    setReportMessage("Merci — votre signalement a été transmis à l’équipe.");
    setTimeout(() => setReportMessage(null), 4000);
  }

  const city = homeContext.city || user?.city || "Reims";

  return (
    <WebAppShell
      context={<FeedHomeRightRail context={homeContext} />}
      contentWidth="feed"
    >
      <div className="space-y-6 pb-16 lg:space-y-7">
        <FeedHomeHeader city={city} />
        <FeedComposer city={city} onSubmit={handleCreate} />
        <TribeDiscoveryCard tribe={homeContext.featuredTribe} />

        {reportMessage ? (
          <p className="rounded-xl bg-yunicity-primary-soft px-4 py-3 text-sm text-yunicity-primary">
            {reportMessage}
          </p>
        ) : null}

        {isLoading ? <FeedLoadingState /> : null}
        {!isLoading && error ? <FeedErrorState onRetry={() => void refresh()} /> : null}
        {!isLoading && !error && items.length === 0 ? <FeedEmptyState city={city} /> : null}

        {!isLoading && !error && items.length > 0 ? (
          <ul className="space-y-5 lg:space-y-6" aria-label="Publications du fil local">
            {items.map((post) => (
              <li key={post.id}>
                <FeedCard post={post} onToggleLike={toggleLike} onReport={handleReport} />
              </li>
            ))}
          </ul>
        ) : null}

        {nextCursor && !isLoading && !error ? (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={() => void loadMore()}
              className="rounded-full border border-yunicity-border bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              {isLoadingMore ? "Chargement…" : FEED_LOAD_MORE_LABEL}
            </button>
          </div>
        ) : null}
      </div>
    </WebAppShell>
  );
}
