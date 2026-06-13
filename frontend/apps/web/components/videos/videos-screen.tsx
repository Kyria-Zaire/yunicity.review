"use client";

import { SessionExpiredPanel } from "@/components/auth/session-expired-panel";
import { LocalVideoFeedViewport } from "@/components/videos/local-video-feed-viewport";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";
import { VideosAppShell } from "@/components/videos/videos-app-shell";
import { VideosFeedEmpty } from "@/components/videos/videos-feed-empty";
import { VideosFeedError } from "@/components/videos/videos-feed-error";
import { VideosFeedSkeleton } from "@/components/videos/videos-feed-skeleton";
import { useLocalVideosFeed } from "@/hooks/use-local-videos-feed";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider } from "@/providers/geo-provider";
import { LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE } from "@yunicity/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function VideosScreen() {
  const { user } = useAuth();
  const defaultCity = user?.city?.trim() || "Reims";

  return (
    <GeoProvider defaultCity={defaultCity}>
      <VideosScreenInner />
    </GeoProvider>
  );
}

function VideosScreenInner() {
  const feed = useLocalVideosFeed();
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <VideosAppShell>
      <div className="relative">
        <header className="absolute left-0 right-0 top-0 z-50 flex items-center gap-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:relative md:px-0 md:pt-0">
          <Link
            href="/feed"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-neutral-900/45 text-white backdrop-blur-sm md:hidden"
            aria-label="Retour au fil"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </Link>
          <h1 className="text-sm font-semibold text-white drop-shadow md:text-lg md:text-neutral-900 md:drop-shadow-none">
            Vidéos
          </h1>
        </header>

        {feed.sessionExpired ? (
          <SessionExpiredPanel
            message={LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE}
            returnPath="/videos"
          />
        ) : feed.isLoading ? (
          <VideosFeedSkeleton />
        ) : feed.error ? (
          <VideosFeedError onRetry={() => void feed.refresh()} />
        ) : feed.items.length === 0 ? (
          <VideosFeedEmpty />
        ) : (
          <LocalVideoFeedViewport
            items={feed.items}
            onOpenComments={() => setCommentsOpen(true)}
            onEndReached={() => {
              if (!feed.isLoadingMore && feed.nextCursor) feed.loadMore();
            }}
          />
        )}

        <VideoCommentsSheet open={commentsOpen} onClose={() => setCommentsOpen(false)} />
      </div>
    </VideosAppShell>
  );
}
