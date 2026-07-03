"use client";

import { SessionExpiredPanel } from "@/components/auth/session-expired-panel";
import { LocalVideoReportSheet } from "@/components/videos/local-video-report-sheet";
import { VideoDetailScreen } from "@/components/videos/video-detail-screen";
import { VideosAppShell } from "@/components/videos/videos-app-shell";
import { VideosDiscoveryScreen } from "@/components/videos/videos-discovery-screen";
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
  const isDetailMode = Boolean(focusVideoId);

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
  const [reportOpen, setReportOpen] = useState(false);
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

  const detailProcessingError = focusVideoId ? processingErrors[focusVideoId] : null;

  return (
    <VideosAppShell>
      <div className="relative">
        {isDetailMode && focusVideoId ? (
          feed.sessionExpired ? (
            <SessionExpiredPanel
              message={LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE}
              returnPath={`/videos?video=${encodeURIComponent(focusVideoId)}`}
            />
          ) : feed.isLoading && pending.processingFeedItems.length === 0 ? (
            <VideosFeedSkeleton />
          ) : feed.error && !displayItems.some((item) => item.id === focusVideoId) ? (
            <VideosFeedError onRetry={() => void feed.refresh()} />
          ) : (
            <VideoDetailScreen
              videoId={focusVideoId}
              items={displayItems}
              isLoading={feed.isLoading}
              processingError={detailProcessingError}
              onDismissProcessing={() => pending.dismissTrack(focusVideoId)}
              onToggleLike={(item) => void interactions.toggleLike(item)}
              onShare={(item) => void interactions.shareVideo(item)}
              onOpenReport={(videoId) => {
                setReportVideoId(videoId);
                setReportOpen(true);
              }}
              onCommentCountDelta={(videoId, delta) => {
                feed.updateItem(videoId, (item) => bumpLocalVideoCommentCount(item, delta));
              }}
              shareHint={interactions.shareHint}
            />
          )
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
