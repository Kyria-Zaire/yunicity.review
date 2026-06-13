"use client";

import { SessionExpiredPanel } from "@/components/auth/session-expired-panel";
import { LocalVideoFeedViewport } from "@/components/videos/local-video-feed-viewport";
import { LocalVideoReportSheet } from "@/components/videos/local-video-report-sheet";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";
import { VideosAppShell } from "@/components/videos/videos-app-shell";
import { VideosFeedEmpty } from "@/components/videos/videos-feed-empty";
import { VideosFeedError } from "@/components/videos/videos-feed-error";
import { VideosFeedSkeleton } from "@/components/videos/videos-feed-skeleton";
import { useLocalVideoInteractions } from "@/hooks/use-local-video-interactions";
import { useLocalVideosFeed } from "@/hooks/use-local-videos-feed";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider } from "@/providers/geo-provider";
import { LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE, bumpLocalVideoCommentCount } from "@yunicity/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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
  const interactions = useLocalVideoInteractions({ updateItem: feed.updateItem });
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [reportVideoId, setReportVideoId] = useState<string | null>(null);

  const activeVideo = useMemo(
    () => feed.items.find((item) => item.id === activeVideoId) ?? feed.items[0] ?? null,
    [activeVideoId, feed.items],
  );

  const commentsVideo = useMemo(() => {
    if (!commentsOpen) return null;
    return feed.items.find((item) => item.id === activeVideoId) ?? activeVideo;
  }, [activeVideo, activeVideoId, commentsOpen, feed.items]);

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

        {interactions.shareHint ? (
          <p className="absolute left-1/2 top-20 z-[55] -translate-x-1/2 rounded-full bg-neutral-900/80 px-4 py-2 text-xs text-white">
            {interactions.shareHint}
          </p>
        ) : null}

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
            onActiveVideoChange={setActiveVideoId}
            onOpenComments={(videoId) => {
              setActiveVideoId(videoId);
              setCommentsOpen(true);
            }}
            onToggleLike={(item) => void interactions.toggleLike(item)}
            onShare={(item) => void interactions.shareVideo(item)}
            onOpenReport={(videoId) => {
              setReportVideoId(videoId);
              setReportOpen(true);
            }}
            onEndReached={() => {
              if (!feed.isLoadingMore && feed.nextCursor) feed.loadMore();
            }}
          />
        )}

        <VideoCommentsSheet
          open={commentsOpen}
          video={commentsVideo}
          onClose={() => setCommentsOpen(false)}
          onCommentCountDelta={(videoId, delta) => {
            feed.updateItem(videoId, (item) => bumpLocalVideoCommentCount(item, delta));
          }}
        />

        <LocalVideoReportSheet
          open={reportOpen}
          onClose={() => {
            setReportOpen(false);
            setReportVideoId(null);
          }}
          alreadyReported={reportVideoId ? interactions.hasReported(reportVideoId) : false}
          errorMessage={interactions.reportError}
          onReport={async (reason) => {
            if (!reportVideoId) return;
            await interactions.reportVideo(reportVideoId, reason);
          }}
        />
      </div>
    </VideosAppShell>
  );
}
