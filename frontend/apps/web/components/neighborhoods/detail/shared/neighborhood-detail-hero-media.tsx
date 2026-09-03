"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type NeighborhoodDetailHeroMediaProps = {
  title: string;
  imageUrl: string | null;
  galleryUrls: string[];
  sizes: string;
  aspectClassName: string;
  photoLabel: (count: number) => string;
  compactPhotoButton?: boolean;
  showCaptionOverlay?: boolean;
};

export function NeighborhoodDetailHeroMedia({
  title,
  imageUrl,
  galleryUrls,
  sizes,
  aspectClassName,
  photoLabel,
  compactPhotoButton = false,
  showCaptionOverlay = true,
}: NeighborhoodDetailHeroMediaProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const photoCount = galleryUrls.length;
  const heroSrc = imageUrl ?? galleryUrls[0] ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight" && photoCount > 0) {
        setActiveIndex((i) => (i + 1) % photoCount);
      }
      if (event.key === "ArrowLeft" && photoCount > 0) {
        setActiveIndex((i) => (i - 1 + photoCount) % photoCount);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [close, lightboxOpen, photoCount]);

  const lightbox =
    lightboxOpen && mounted && photoCount > 0
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={photoLabel(photoCount)}
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-5 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900 shadow"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <div
              className="relative flex max-h-[85vh] w-full max-w-4xl flex-col items-center"
              onClick={(event) => event.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryUrls[activeIndex] ?? heroSrc ?? ""}
                alt={title}
                className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain"
              />
              {photoCount > 1 ? (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900"
                    aria-label="Photo précédente"
                    onClick={() => setActiveIndex((i) => (i - 1 + photoCount) % photoCount)}
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <p className="text-sm font-medium text-white">
                    {activeIndex + 1} / {photoCount}
                  </p>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900"
                    aria-label="Photo suivante"
                    onClick={() => setActiveIndex((i) => (i + 1) % photoCount)}
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100">
        <div className={`relative w-full ${aspectClassName}`}>
          <CulturalImage
            src={heroSrc}
            alt={title}
            placeName={title}
            sizes={sizes}
            className="absolute inset-0 h-full w-full"
            imageClassName="h-full w-full object-cover"
            dimOverlay={false}
            showFallbackCaption={false}
            fallbackLabel="Quartier"
            priority
          />
          {showCaptionOverlay ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pb-4 pt-16"
              aria-hidden
            >
              <span className="inline-flex rounded-md bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Quartier
              </span>
              <p className="mt-1.5 text-lg font-bold leading-tight text-white sm:text-xl">{title}</p>
            </div>
          ) : null}
          {photoCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                setActiveIndex(0);
                setLightboxOpen(true);
              }}
              className={
                compactPhotoButton
                  ? "absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm backdrop-blur transition hover:bg-white"
                  : "absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur transition hover:bg-white"
              }
            >
              <Camera className={compactPhotoButton ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
              {photoLabel(photoCount)}
            </button>
          ) : null}
        </div>
      </div>
      {lightbox}
    </>
  );
}
