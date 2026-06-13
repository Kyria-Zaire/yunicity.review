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
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider } from "@/providers/geo-provider";
import {
  LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE,
  bumpLocalVideoCommentCount,
  reorderLocalVideoFeedForFocus,
} from "@yunicity/utils";
import type { LocalVideoFeedItem } from "@yunicity/types";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const api = useYunicityApi();
  const searchParams = useSearchParams();
  const focusVideoId = searchParams.get("video")?.trim() || null;

  const feed = useLocalVideosFeed();
  const interactions = useLocalVideoInteractions({ updateItem: feed.updateItem });
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [reportVideoId, setReportVideoId] = useState<string | null>(null);
  const [pinnedVideo, setPinnedVideo] = useState<LocalVideoFeedItem | null>(null);

  useEffect(() => {
    if (!focusVideoId || feed.isLoading) return;
    if (feed.items.some((item) => item.id === focusVideoId)) {
      setPinnedVideo(null);
      return;
    }

    let cancelled = false;
    void api
      .getLocalVideo(focusVideoId)
      .then((video) => {
        if (!cancelled) setPinnedVideo(video);
      })
      .catch(() => {
        if (!cancelled) setPinnedVideo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [api, feed.isLoading, feed.items, focusVideoId]);

  const displayItems = useMemo(() => {
    let list = feed.items;
    if (pinnedVideo && !list.some((item) => item.id === pinnedVideo.id)) {
      list = [pinnedVideo, ...list];
    }
    return reorderLocalVideoFeedForFocus(list, focusVideoId);
  }, [feed.items, focusVideoId, pinnedVideo]);

  const activeVideo = useMemo(
    () => displayItems.find((item) => item.id === activeVideoId) ?? displayItems[0] ?? null,
    [activeVideoId, displayItems],
  );

  const commentsVideo = useMemo(() => {
    if (!commentsOpen) return null;
    return displayItems.find((item) => item.id === activeVideoId) ?? activeVideo;
  }, [activeVideo, activeVideoId, commentsOpen, displayItems]);

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
          <h1 className="text-sm font-semibold text-white drop-shadow md:text-lg md:text-neutral-900 md:drop-shadow-none xl:hidden">
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
        ) : displayItems.length === 0 ? (
          <VideosFeedEmpty />
        ) : (
          <LocalVideoFeedViewport
            items={displayItems}
            focusVideoId={focusVideoId}
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
