"use client";

import { SessionExpiredPanel } from "@/components/auth/session-expired-panel";
import { LocalVideoFeedViewport } from "@/components/videos/local-video-feed-viewport";
import { LocalVideoReportSheet } from "@/components/videos/local-video-report-sheet";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";
import { VideosAppShell } from "@/components/videos/videos-app-shell";
import { VideosDiscoveryScreen } from "@/components/videos/videos-discovery-screen";
import { VideosFeedEmpty } from "@/components/videos/videos-feed-empty";
import { VideosFeedError } from "@/components/videos/videos-feed-error";
import { VideosFeedSkeleton } from "@/components/videos/videos-feed-skeleton";
import { useLocalVideoInteractions } from "@/hooks/use-local-video-interactions";
import { useLocalVideoPendingTracker } from "@/hooks/use-local-video-pending-tracker";
import { useLocalVideosFeed } from "@/hooks/use-local-videos-feed";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider } from "@/providers/geo-provider";
import {
  LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE,
  bumpLocalVideoCommentCount,
  isLocalVideoFeedItemPlayable,
  isLocalVideoProcessingReady,
  mapLocalVideoToFeedPreview,
  registerLocalVideoPending,
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
  const isImmersiveMode = Boolean(focusVideoId);

  const feed = useLocalVideosFeed();
  const pending = useLocalVideoPendingTracker({
    onPublished: (videoId) => {
      void feed.refresh();
      if (focusVideoId === videoId) {
        void api
          .getLocalVideo(videoId)
          .then((video) => setPinnedVideo(video))
          .catch(() => {});
      }
    },
  });
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
      .getVideo(focusVideoId)
      .then((video) => {
        if (cancelled) return;
        if (!isLocalVideoProcessingReady(video)) {
          registerLocalVideoPending({
            videoId: video.id,
            title: video.title,
            registeredAt: video.created_at,
          });
          pending.syncFromStorage();
        }
        setPinnedVideo(mapLocalVideoToFeedPreview(video));
      })
      .catch(() => {
        if (!cancelled) setPinnedVideo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [api, feed.isLoading, feed.items, focusVideoId, pending.syncFromStorage]);

  const displayItems = useMemo(() => {
    const byId = new Map<string, LocalVideoFeedItem>();

    for (const item of feed.items) {
      byId.set(item.id, item);
    }

    for (const processingItem of pending.processingFeedItems) {
      const existing = byId.get(processingItem.id);
      if (existing && isLocalVideoFeedItemPlayable(existing)) continue;
      byId.set(processingItem.id, processingItem);
    }

    if (pinnedVideo) {
      const existing = byId.get(pinnedVideo.id);
      if (!existing || !isLocalVideoFeedItemPlayable(existing)) {
        byId.set(pinnedVideo.id, pinnedVideo);
      }
    }

    return reorderLocalVideoFeedForFocus(Array.from(byId.values()), focusVideoId);
  }, [feed.items, focusVideoId, pending.processingFeedItems, pinnedVideo]);

  const processingErrors = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const track of pending.tracks) {
      if (track.error) map[track.record.videoId] = track.error;
    }
    return map;
  }, [pending.tracks]);

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
        {isImmersiveMode ? (
          <>
            <header className="absolute left-0 right-0 top-0 z-50 flex items-center gap-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:relative md:px-0 md:pt-0">
              <Link
                href="/videos"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-neutral-900/45 text-white backdrop-blur-sm md:bg-neutral-100 md:text-neutral-900"
                aria-label="Retour aux vidéos"
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
            ) : feed.isLoading && pending.processingFeedItems.length === 0 ? (
              <VideosFeedSkeleton />
            ) : feed.error ? (
              <VideosFeedError onRetry={() => void feed.refresh()} />
            ) : displayItems.length === 0 ? (
              <VideosFeedEmpty />
            ) : (
              <LocalVideoFeedViewport
                items={displayItems}
                focusVideoId={focusVideoId}
                processingErrors={processingErrors}
                onDismissProcessing={pending.dismissTrack}
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
          </>
        ) : feed.sessionExpired ? (
          <SessionExpiredPanel message={LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE} returnPath="/videos" />
        ) : (
          <VideosDiscoveryScreen
            items={displayItems}
            isLoading={feed.isLoading && pending.processingFeedItems.length === 0}
            error={feed.error}
            hasMoreFeed={Boolean(feed.nextCursor)}
            isLoadingMore={feed.isLoadingMore}
            onRetry={() => void feed.refresh()}
            onLoadMoreFeed={() => {
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
