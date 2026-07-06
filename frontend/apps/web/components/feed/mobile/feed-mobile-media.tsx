"use client";

function isVideoMediaUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return (
    /\.(mp4|webm|mov|m4v)(\?|$)/.test(normalized) ||
    normalized.includes("/local-videos/") ||
    normalized.includes("/videos/")
  );
}

function IconPlay() {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

/** Média feed mobile — image ou vidéo avec overlay lecture (MOBILE-REFONDE-01). */
export function FeedMobileMedia({ mediaUrl }: { mediaUrl: string }) {
  const isVideo = isVideoMediaUrl(mediaUrl);

  if (isVideo) {
    return (
      <div className="relative mt-3 overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-900">
        <video
          src={mediaUrl}
          className="max-h-80 w-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md">
            <IconPlay />
          </span>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl}
      alt=""
      loading="lazy"
      decoding="async"
      className="mt-3 max-h-80 w-full rounded-xl border border-neutral-200/80 object-cover"
    />
  );
}
