"use client";

import {
  AUTHORIZED_MEDIA_RETRY_LABEL,
  AUTHORIZED_MEDIA_UNAVAILABLE,
  isAuthorizedStoryMediaUrl,
} from "@yunicity/utils";

import { AvatarImage } from "@/components/avatar-image";
import { useAuthorizedMediaSource } from "@/hooks/use-authorized-media-source";

export function isStoryVideoMedia(mediaUrl: string): boolean {
  return /\.(mp4|webm)(?:[?#]|$)/i.test(mediaUrl);
}

export function AuthorizedStoryMedia({
  mediaUrl,
  alt = "",
  className,
  controls = false,
}: {
  mediaUrl: string | null | undefined;
  alt?: string;
  className: string;
  controls?: boolean;
}) {
  const source = useAuthorizedMediaSource(mediaUrl);
  const normalizedMediaUrl = mediaUrl?.trim() ?? "";
  const video = isStoryVideoMedia(normalizedMediaUrl);

  if (!normalizedMediaUrl) {
    return (
      <div
        data-story-media-state="missing"
        className={`${className} flex items-center justify-center bg-neutral-900 px-3 text-center text-sm text-white`}
        role="alert"
      >
        {AUTHORIZED_MEDIA_UNAVAILABLE}
      </div>
    );
  }

  if (source.status === "error") {
    return (
      <div
        data-story-media-state="error"
        className={`${className} flex flex-col items-center justify-center gap-2 bg-neutral-900 px-3 text-center text-white`}
        role="alert"
      >
        <span className="text-sm">{AUTHORIZED_MEDIA_UNAVAILABLE}</span>
        <button
          type="button"
          onClick={source.retry}
          className="min-h-11 rounded-lg bg-white/15 px-3 text-sm font-medium"
        >
          {AUTHORIZED_MEDIA_RETRY_LABEL}
        </button>
      </div>
    );
  }

  if (!source.objectUrl) {
    return (
      <div
        data-story-media-state="loading"
        className={`${className} bg-neutral-800 motion-safe:animate-pulse`}
        role="status"
        aria-label="Chargement du média Story"
      />
    );
  }

  if (video) {
    return (
      <video
        data-story-media-state={source.status}
        src={source.objectUrl}
        className={className}
        muted
        controls={controls}
        playsInline
        preload="metadata"
        aria-label={alt}
        onLoadedData={source.markDisplayed}
        onError={source.markDecodeFailed}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- object URL authentifiée
    <img
      data-story-media-state={source.status}
      src={source.objectUrl}
      alt={alt}
      className={className}
      onLoad={source.markDisplayed}
      onError={source.markDecodeFailed}
    />
  );
}

/** Les anneaux peuvent contenir soit le dernier média Story, soit un avatar public. */
export function StoryRingMedia({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  return isAuthorizedStoryMediaUrl(src) ? (
    <AuthorizedStoryMedia mediaUrl={src} alt="" className={className} />
  ) : (
    <AvatarImage src={src} alt="" className={className} />
  );
}
