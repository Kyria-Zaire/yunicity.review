"use client";

import type { EditorialImageCredit } from "@yunicity/utils";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

type CulturalImageProps = {
  src: string | null;
  alt: string;
  placeName: string;
  className?: string;
  imageClassName?: string;
  sizes: string;
  priority?: boolean;
  showFallbackCaption?: boolean;
  /** Badge affiché dans le fallback (dégradé + nom). Défaut « Culture ». */
  fallbackLabel?: string;
  /** @deprecated Utiliser dimOverlay. */
  overlay?: boolean;
  /** Voile sombre sur l'image. Désactiver pour hero / lightbox. Défaut true. */
  dimOverlay?: boolean;
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
  fallbackLabel = "Culture",
  overlay,
  dimOverlay = true,
}: CulturalImageProps) {
  const showDim = overlay === false ? false : dimOverlay;
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const safeSrc = useMemo(() => (src?.trim() ? src : null), [src]);
  const showImage = Boolean(safeSrc) && !failed;

  return (
    <div className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
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
        <div className={`absolute inset-0 h-full w-full ${FALLBACK_GRADIENT}`} aria-hidden />
      )}

      {showDim ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden />
      ) : null}

      {!showImage && showFallbackCaption ? (
        <div className="absolute inset-0 flex items-end p-3">
          <div className="rounded-lg bg-white/12 px-2.5 py-2 backdrop-blur-sm">
            <div className="mb-1 inline-block rounded bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">
              {fallbackLabel}
            </div>
            <p className="line-clamp-2 text-xs font-medium text-white/90">{placeName}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type CulturalImageCreditDefaultProps = {
  variant?: "default";
  credit: string | null;
  sourceUrl?: string | null;
  className?: string;
};

type CulturalImageCreditCompactProps = {
  variant: "compact";
  editorialCredit: EditorialImageCredit | null;
  className?: string;
};

export type CulturalImageCreditProps =
  | CulturalImageCreditDefaultProps
  | CulturalImageCreditCompactProps;

/**
 * Attribution d'une image tierce.
 *
 * - `default` : ligne textuelle (cartes culture, recherche…).
 * - `compact` : bouton ⓘ superposé + popover accessible (quartiers Wikimedia).
 */
export function CulturalImageCredit(props: CulturalImageCreditProps) {
  if (props.variant === "compact") {
    return <CulturalImageCreditCompact {...props} />;
  }
  return <CulturalImageCreditDefault {...props} />;
}

function CulturalImageCreditDefault({
  credit,
  sourceUrl = null,
  className,
}: CulturalImageCreditDefaultProps) {
  if (!credit) return null;
  const compact = credit.length > 88 ? `${credit.slice(0, 85)}...` : credit;
  const textClassName = `mt-2 line-clamp-1 text-[10px] text-neutral-500 ${className ?? ""}`;
  if (!sourceUrl) {
    return (
      <p className={textClassName} title={credit}>
        {compact}
      </p>
    );
  }
  return (
    <p className={textClassName} title={credit}>
      <a
        href={sourceUrl}
        target="_blank"
        rel="license noopener noreferrer"
        aria-label={`${credit} — ouvrir la page source (nouvel onglet)`}
        className="rounded underline underline-offset-2 transition hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
      >
        {compact}
      </a>
    </p>
  );
}

function CulturalImageCreditCompact({
  editorialCredit,
  className,
}: CulturalImageCreditCompactProps) {
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) close();
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [close, open]);

  if (!editorialCredit) return null;

  const ariaLabel = `Crédits de la photographie ${editorialCredit.commonsFile}`;

  return (
    <div
      ref={rootRef}
      className={`pointer-events-none ${className ?? "absolute right-2 top-2 z-20"}`}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }}
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/45 text-[13px] font-semibold leading-none text-white shadow-sm backdrop-blur-sm transition hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span aria-hidden>ⓘ</span>
      </button>

      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label={ariaLabel}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          className="pointer-events-auto absolute right-0 top-[calc(100%+6px)] z-30 w-[min(17rem,calc(100vw-2rem))] rounded-xl border border-neutral-200/90 bg-white/95 p-3 text-left shadow-lg backdrop-blur-md"
        >
          <p className="text-xs font-semibold leading-snug text-neutral-900">
            <a
              href={editorialCredit.sourceUrl}
              target="_blank"
              rel="license noopener noreferrer"
              className="underline underline-offset-2 hover:text-yunicity-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
            >
              {editorialCredit.commonsFile}
            </a>
          </p>
          <dl className="mt-2 space-y-1 text-[11px] leading-snug text-neutral-600">
            <div className="flex gap-1">
              <dt className="shrink-0 font-medium text-neutral-700">Photo :</dt>
              <dd>{editorialCredit.author}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="shrink-0 font-medium text-neutral-700">Licence :</dt>
              <dd>
                <a
                  href={editorialCredit.licenseUrl}
                  target="_blank"
                  rel="license noopener noreferrer"
                  className="underline underline-offset-2 hover:text-yunicity-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
                >
                  {editorialCredit.license}
                </a>
              </dd>
            </div>
            <div className="flex gap-1">
              <dt className="shrink-0 font-medium text-neutral-700">Source :</dt>
              <dd>
                <a
                  href={editorialCredit.sourceUrl}
                  target="_blank"
                  rel="license noopener noreferrer"
                  className="underline underline-offset-2 hover:text-yunicity-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
                >
                  Wikimedia Commons
                </a>
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
