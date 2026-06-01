"use client";

import { useMemo, useState } from "react";

type CulturalImageProps = {
  src: string | null;
  alt: string;
  placeName: string;
  className?: string;
  imageClassName?: string;
  sizes: string;
  priority?: boolean;
  showFallbackCaption?: boolean;
  /** @deprecated Ignoré — préférer un overlay via un conteneur parent. */
  overlay?: boolean;
};

const FALLBACK_GRADIENT =
  "bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.3),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.22),transparent_45%),linear-gradient(145deg,#0f172a_0%,#111827_45%,#1e293b_100%)]";

/**
 * Images culturelles distantes (Wikimedia, Unsplash, etc.).
 * On utilise <img> natif pour éviter les erreurs runtime next/image
 * quand un domaine seed n'est pas encore déclaré ou que le dev server
 * n'a pas rechargé next.config. Les domaines autorisés restent listés
 * dans lib/cultural-image-hosts.ts + next.config.ts pour d'autres usages.
 */
export function CulturalImage({
  src,
  alt,
  placeName,
  className,
  imageClassName,
  sizes,
  priority = false,
  showFallbackCaption = true,
}: CulturalImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const safeSrc = useMemo(() => (src?.trim() ? src : null), [src]);
  const showImage = Boolean(safeSrc) && !failed;

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {showImage ? (
        <>
          {!loaded ? <div className="absolute inset-0 animate-pulse bg-neutral-200/80" aria-hidden /> : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeSrc!}
            alt={alt}
            className={`absolute inset-0 h-full w-full object-cover ${imageClassName ?? ""}`}
            sizes={sizes}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      ) : (
        <div className={`absolute inset-0 ${FALLBACK_GRADIENT}`} aria-hidden />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden />

      {!showImage && showFallbackCaption ? (
        <div className="absolute inset-0 flex items-end p-3">
          <div className="rounded-lg bg-white/12 px-2.5 py-2 backdrop-blur-sm">
            <div className="mb-1 inline-block rounded bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">
              Culture
            </div>
            <p className="line-clamp-2 text-xs font-medium text-white/90">{placeName}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CulturalImageCredit({ credit }: { credit: string | null }) {
  if (!credit) return null;
  const compact = credit.length > 88 ? `${credit.slice(0, 85)}...` : credit;
  return (
    <p className="mt-2 line-clamp-1 text-[10px] text-neutral-400" title={credit}>
      {compact}
    </p>
  );
}
