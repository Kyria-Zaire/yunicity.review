"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEO_DETAIL_BACK,
  VIDEO_DETAIL_LOADING,
  VIDEO_DETAIL_NOT_FOUND,
  buildLocalVideoTeaserHref,
  isLocalVideoFeedItemPlayable,
  isLocalVideoFeedItemProcessing,
  pickRelatedVideos,
} from "@yunicity/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { LocalVideoProcessingSlide } from "@/components/videos/local-video-processing-slide";
import { VideosMobileDetailComments } from "@/components/videos/mobile/videos-mobile-detail-comments";
import { VideosMobileDetailHeader } from "@/components/videos/mobile/videos-mobile-detail-header";
import { VideosMobileDetailMeta } from "@/components/videos/mobile/videos-mobile-detail-meta";
import { VideosMobileDetailPlayer } from "@/components/videos/mobile/videos-mobile-detail-player";
import { VideoDetailCommentsSection } from "@/components/videos/video-detail-comments-section";
import { VideoDetailMeta } from "@/components/videos/video-detail-meta";
import { VideoDetailPlayer } from "@/components/videos/video-detail-player";
import { VideoDetailSidebar } from "@/components/videos/video-detail-sidebar";

type VideoDetailScreenProps = {
  videoId: string;
  items: readonly LocalVideoFeedItem[];
  isLoading: boolean;
  processingError?: string | null;
  onDismissProcessing?: () => void;
  onToggleLike: (item: LocalVideoFeedItem) => void;
  onShare: (item: LocalVideoFeedItem) => void;
  onOpenReport: (videoId: string) => void;
  onCommentCountDelta: (videoId: string, delta: number) => void;
  shareHint?: string | null;
};

export function VideoDetailScreen({
  videoId,
  items,
  isLoading,
  processingError,
  onDismissProcessing,
  onToggleLike,
  onShare,
  onOpenReport,
  onCommentCountDelta,
  shareHint,
}: VideoDetailScreenProps) {
  const router = useRouter();
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  const video = useMemo(
    () => items.find((item) => item.id === videoId) ?? null,
    [items, videoId],
  );

  const relatedVideos = useMemo(
    () => pickRelatedVideos(items, videoId, 8),
    [items, videoId],
  );

  const scrollToComments = useCallback(() => {
    document.getElementById("video-detail-comments")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleVideoEnded = useCallback(() => {
    if (!autoplayEnabled) return;
    const next = relatedVideos[0];
    if (!next) return;
    router.push(buildLocalVideoTeaserHref(next.id));
  }, [autoplayEnabled, relatedVideos, router]);

  if (isLoading && !video) {
    return (
      <>
        <div className="web-mobile-videos-only px-4 py-16 text-center text-sm text-neutral-500">
          {VIDEO_DETAIL_LOADING}
        </div>
        <div className="web-desktop-videos-only mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-neutral-500">
          {VIDEO_DETAIL_LOADING}
        </div>
      </>
    );
  }

  if (!video) {
    return (
      <>
        <div className="web-mobile-videos-only px-4 py-16 text-center">
          <p className="text-sm text-neutral-600">{VIDEO_DETAIL_NOT_FOUND}</p>
          <Link
            href="/videos"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {VIDEO_DETAIL_BACK}
          </Link>
        </div>
        <div className="web-desktop-videos-only mx-auto max-w-[1400px] px-4 py-16 text-center">
          <p className="text-sm text-neutral-600">{VIDEO_DETAIL_NOT_FOUND}</p>
          <Link
            href="/videos"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {VIDEO_DETAIL_BACK}
          </Link>
        </div>
      </>
    );
  }

  if (isLocalVideoFeedItemProcessing(video)) {
    return (
      <>
        <div className="web-mobile-videos-only min-h-dvh bg-white">
          <VideosMobileDetailHeader onOpenReport={() => onOpenReport(video.id)} />
          <div className="px-4 py-4">
            <LocalVideoProcessingSlide
              item={video}
              errorMessage={processingError}
              onDismiss={onDismissProcessing}
            />
          </div>
        </div>
        <div className="web-desktop-videos-only mx-auto max-w-[1400px] px-4 py-4">
          <Link
            href="/videos"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-yunicity-primary"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {VIDEO_DETAIL_BACK}
          </Link>
          <LocalVideoProcessingSlide
            item={video}
            errorMessage={processingError}
            onDismiss={onDismissProcessing}
          />
        </div>
      </>
    );
  }

  if (!isLocalVideoFeedItemPlayable(video)) {
    return (
      <>
        <div className="web-mobile-videos-only px-4 py-16 text-center">
          <p className="text-sm text-neutral-600">{VIDEO_DETAIL_NOT_FOUND}</p>
        </div>
        <div className="web-desktop-videos-only mx-auto max-w-[1400px] px-4 py-16 text-center">
          <p className="text-sm text-neutral-600">{VIDEO_DETAIL_NOT_FOUND}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="web-mobile-videos-only min-h-dvh bg-white">
        <VideosMobileDetailHeader onOpenReport={() => onOpenReport(video.id)} />

        {shareHint ? (
          <p className="mx-4 mt-3 rounded-full bg-neutral-900 px-4 py-2 text-center text-xs text-white">
            {shareHint}
          </p>
        ) : null}

        <div className="space-y-5 px-4 py-3">
          <VideosMobileDetailPlayer item={video} onEnded={handleVideoEnded} />
          <VideosMobileDetailMeta
            item={video}
            onToggleLike={() => onToggleLike(video)}
            onShare={() => onShare(video)}
            onOpenComments={scrollToComments}
          />
          <VideosMobileDetailComments
            video={video}
            onCommentCountDelta={onCommentCountDelta}
          />
        </div>
      </div>

      <div className="web-desktop-videos-only mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 sm:py-4">
        <Link
          href="/videos"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 transition hover:text-yunicity-primary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {VIDEO_DETAIL_BACK}
        </Link>

        {shareHint ? (
          <p className="mb-4 rounded-full bg-neutral-900 px-4 py-2 text-center text-xs text-white">
            {shareHint}
          </p>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-8">
            <VideoDetailPlayer
              item={video}
              onOpenReport={() => onOpenReport(video.id)}
              onEnded={handleVideoEnded}
            />
            <VideoDetailMeta
              item={video}
              onToggleLike={() => onToggleLike(video)}
              onShare={() => onShare(video)}
              onOpenComments={scrollToComments}
              onOpenReport={() => onOpenReport(video.id)}
            />
            <VideoDetailCommentsSection
              video={video}
              onCommentCountDelta={onCommentCountDelta}
            />
          </div>

          <VideoDetailSidebar
            video={video}
            items={items}
            autoplayEnabled={autoplayEnabled}
            onAutoplayChange={setAutoplayEnabled}
            onOpenReport={() => onOpenReport(video.id)}
          />
        </div>
      </div>
    </>
  );
}
