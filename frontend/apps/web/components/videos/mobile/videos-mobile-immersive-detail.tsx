"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";

import { VideosMobileImmersiveFeed } from "@/components/videos/mobile/videos-mobile-immersive-feed";

type VideosMobileImmersiveDetailProps = {
  focusVideoId: string;
  items: readonly LocalVideoFeedItem[];
  processingErrors: Record<string, string | null | undefined>;
  onDismissProcessing?: () => void;
  onToggleLike: (item: LocalVideoFeedItem) => void;
  onShare: (item: LocalVideoFeedItem) => void;
  onOpenReport: (videoId: string) => void;
  onCommentCountDelta: (videoId: string, delta: number) => void;
  onLoadMore?: () => void;
};

/** Détail vidéo mobile immersif — wrapper fin autour du feed vertical partagé. */
export function VideosMobileImmersiveDetail(props: VideosMobileImmersiveDetailProps) {
  const { onDismissProcessing, focusVideoId, ...rest } = props;

  return (
    <VideosMobileImmersiveFeed
      {...rest}
      variant="detail"
      focusVideoId={focusVideoId}
      onDismissProcessing={
        onDismissProcessing
          ? (videoId) => {
              if (videoId === focusVideoId) onDismissProcessing();
            }
          : undefined
      }
    />
  );
}
