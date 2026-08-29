"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_TEASER_CTA,
  buildLocalVideoTeaserHref,
  bumpLocalVideoCommentCount,
  formatLocalVideoDuration,
  formatLocalVideoTypeLabel,
  formatVideoAuthorDisplayName,
  resolveLocalVideoTeaserTitle,
} from "@yunicity/utils";
import { Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { FeedVideoStreamSocialActions } from "@/components/feed/feed-publication-actions";
import { ProfileAvatar } from "@/components/profile-avatar";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";
import { useLocalVideoInteractions } from "@/hooks/use-local-video-interactions";

type FeedVideoStreamLayout = "default" | "desktop";

type FeedVideoStreamItemProps = {
  video: LocalVideoFeedItem;
  layout?: FeedVideoStreamLayout;
};

function VideoStreamHeader({ auteur, video }: { auteur: string; video: LocalVideoFeedItem }) {
  return (
    <div
      data-feed-video-stream-header=""
      data-feed-publication-header=""
      className="flex items-start gap-3"
    >
      <ProfileAvatar name={auteur} size="sm" />
      <div className="min-w-0">
        <p
          data-feed-video-stream-author=""
          data-feed-publication-identity=""
          className="truncate text-sm font-bold text-neutral-900"
        >
          {auteur}
        </p>
        <p
          data-feed-video-stream-context=""
          data-feed-publication-meta=""
          className="truncate text-xs text-neutral-500"
        >
          {video.neighborhood_name} · {formatLocalVideoTypeLabel(video.video_type)}
        </p>
      </div>
    </div>
  );
}

function VideoStreamMedia({ thumbnailUrl, durationSeconds }: { thumbnailUrl: string; durationSeconds: number }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumbnail = Boolean(thumbnailUrl?.trim()) && !thumbFailed;

  return (
    <div
      data-feed-video-stream-media=""
      className="relative w-full overflow-hidden bg-neutral-100"
      style={{ aspectRatio: "16 / 9" }}
    >
      {showThumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          data-feed-video-stream-thumb=""
          src={thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
          onError={() => setThumbFailed(true)}
        />
      ) : (
        <div
          data-feed-video-stream-thumb=""
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-yunicity-primary/15 via-yunicity-primary/5 to-neutral-100"
          aria-hidden
        />
      )}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-neutral-950/10 transition group-hover:bg-neutral-950/20">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-neutral-200/80">
          <Play className="ml-0.5 h-5 w-5 fill-yunicity-primary text-yunicity-primary" aria-hidden />
        </span>
      </div>

      <span
        data-feed-video-stream-duration=""
        className="absolute bottom-2 right-2 rounded-md bg-neutral-950/75 px-2 py-0.5 text-xs font-semibold tabular-nums text-white"
      >
        {formatLocalVideoDuration(durationSeconds)}
      </span>
    </div>
  );
}

function VideoStreamCta({ layout }: { layout: FeedVideoStreamLayout }) {
  return (
    <p
      data-feed-video-stream-cta=""
      data-feed-publication-cta=""
      className={
        layout === "desktop"
          ? "text-sm font-semibold text-yunicity-primary group-hover:underline"
          : "mt-3 text-sm font-semibold text-yunicity-primary group-hover:underline"
      }
    >
      {LOCAL_VIDEO_TEASER_CTA}
    </p>
  );
}

function VideoStreamActionsFooter({
  video,
  commentsOpen,
  onToggleLike,
  onToggleComments,
  onShare,
  shareHint,
  layout,
}: {
  video: LocalVideoFeedItem;
  commentsOpen: boolean;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onShare: () => void;
  shareHint: string | null;
  layout: FeedVideoStreamLayout;
}) {
  return (
    <footer
      data-feed-publication-actions=""
      className={
        layout === "desktop"
          ? "border-t border-neutral-100 px-5 py-2.5 sm:px-6 sm:py-3"
          : "border-t border-neutral-100/90 px-4 py-2.5 sm:px-5 sm:py-3"
      }
    >
      <FeedVideoStreamSocialActions
        video={video}
        commentsOpen={commentsOpen}
        onToggleLike={onToggleLike}
        onToggleComments={onToggleComments}
        onShare={onShare}
        shareHint={shareHint}
      />
    </footer>
  );
}

function VideoStreamLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} data-feed-video-stream-item="" className={className}>
      {children}
    </Link>
  );
}

/**
 * Publication vidéo du flux medium (C3-FEED-M7-R2).
 *
 * La vignette et le contenu mènent vers `/videos?video=<uuid>`. Les actions
 * sociales (Réagir, Discuter, Partager) utilisent les endpoints `local_videos`
 * dédiés, distincts des publications texte.
 */
export function FeedVideoStreamItem({ video: initialVideo, layout = "default" }: FeedVideoStreamItemProps) {
  const [video, setVideo] = useState(initialVideo);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const isDesktop = layout === "desktop";

  useEffect(() => {
    setVideo(initialVideo);
  }, [initialVideo]);

  const interactions = useLocalVideoInteractions({
    updateItem: (_videoId, updater) => {
      setVideo((current) => updater(current));
    },
  });

  const titre = resolveLocalVideoTeaserTitle(video);
  const auteur = formatVideoAuthorDisplayName(video);
  const href = buildLocalVideoTeaserHref(video.id);

  const actionsFooter = (
    <VideoStreamActionsFooter
      video={video}
      commentsOpen={commentsOpen}
      onToggleLike={() => void interactions.toggleLike(video)}
      onToggleComments={() => setCommentsOpen(true)}
      onShare={() => void interactions.shareVideo(video)}
      shareHint={interactions.shareHint}
      layout={layout}
    />
  );

  const editorial = (
    <div data-feed-publication-editorial="">
      {isDesktop ? (
        <>
          <VideoStreamLink
            href={href}
            className="group block transition hover:bg-neutral-50/60"
          >
            <div data-feed-publication-content="" className="px-5 pb-4 pt-5 sm:px-6">
              <VideoStreamHeader auteur={auteur} video={video} />
              <p
                data-feed-video-stream-headline=""
                data-feed-publication-body=""
                className="mt-3 text-[15px] font-semibold leading-snug text-neutral-900"
              >
                {titre}
              </p>
            </div>
            <VideoStreamMedia
              thumbnailUrl={video.thumbnail_url}
              durationSeconds={video.duration_seconds}
            />
            <div className="border-t border-neutral-100 px-5 py-3.5 sm:px-6">
              <VideoStreamCta layout={layout} />
            </div>
          </VideoStreamLink>
          {actionsFooter}
        </>
      ) : (
        <>
          <div className="p-5 sm:p-6">
            <VideoStreamLink href={href} className="group block transition hover:bg-neutral-50/60">
              <VideoStreamHeader auteur={auteur} video={video} />
              <p
                data-feed-video-stream-headline=""
                data-feed-publication-body=""
                className="mt-3 text-[15px] font-semibold leading-snug text-neutral-900"
              >
                {titre}
              </p>
              <div className="mt-3 overflow-hidden rounded-xl">
                <VideoStreamMedia
                  thumbnailUrl={video.thumbnail_url}
                  durationSeconds={video.duration_seconds}
                />
              </div>
              <VideoStreamCta layout={layout} />
            </VideoStreamLink>
          </div>
          {actionsFooter}
        </>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <article
        data-feed-medium-surface="primary"
        className="feed-desktop-surface feed-publication-video-editorial overflow-hidden"
      >
        {editorial}
        <VideoCommentsSheet
          open={commentsOpen}
          video={video}
          onClose={() => setCommentsOpen(false)}
          onCommentCountDelta={(_videoId, delta) => {
            setVideo((current) => bumpLocalVideoCommentCount(current, delta));
          }}
        />
      </article>
    );
  }

  return (
    <div
      data-feed-medium-surface="primary"
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
    >
      {editorial}
      <VideoCommentsSheet
        open={commentsOpen}
        video={video}
        onClose={() => setCommentsOpen(false)}
        onCommentCountDelta={(_videoId, delta) => {
          setVideo((current) => bumpLocalVideoCommentCount(current, delta));
        }}
      />
    </div>
  );
}
