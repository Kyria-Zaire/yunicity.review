"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { PLACE_DETAIL_DESKTOP_GALLERY } from "@yunicity/utils";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type PlaceDesktopDetailGalleryProps = {
  title: string;
  imageUrls: string[];
  onRegisterOpen?: (open: (index?: number) => void) => void;
};

export function PlaceDesktopDetailGallery({
  title,
  imageUrls,
  onRegisterOpen,
}: PlaceDesktopDetailGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const primary = imageUrls[0] ?? null;
  const secondary = imageUrls.slice(1, 3);
  const paddedSecondary = [
    secondary[0] ?? primary,
    secondary[1] ?? secondary[0] ?? primary,
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen || imageUrls.length === 0) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") setActiveIndex((i) => (i + 1) % imageUrls.length);
      if (event.key === "ArrowLeft") setActiveIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [close, imageUrls.length, lightboxOpen]);

  const openLightbox = useCallback((index = 0) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

  useEffect(() => {
    onRegisterOpen?.(openLightbox);
  }, [onRegisterOpen, openLightbox]);

  const lightbox =
    lightboxOpen && mounted && imageUrls.length > 0
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={PLACE_DETAIL_DESKTOP_GALLERY(imageUrls.length)}
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
            <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrls[activeIndex] ?? primary ?? ""}
                alt={title}
                className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain"
              />
              {imageUrls.length > 1 ? (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-900"
                    aria-label="Photo précédente"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <p className="text-sm font-medium text-white">
                    {activeIndex + 1} / {imageUrls.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((i) => (i + 1) % imageUrls.length)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-900"
                    aria-label="Photo suivante"
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

  if (!primary) return null;

  return (
    <>
      <div
        className="grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-[1.35fr_0.85fr] sm:grid-rows-2"
        data-place-desktop-detail-gallery=""
      >
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="relative min-h-[220px] overflow-hidden rounded-2xl bg-neutral-200 sm:row-span-2 sm:min-h-[320px]"
        >
          <CulturalImage
            src={primary}
            alt=""
            placeName={title}
            className="absolute inset-0 size-full"
            sizes="(max-width: 1024px) 100vw, 720px"
            priority
            showFallbackCaption={false}
            dimOverlay={false}
          />
        </button>

        {paddedSecondary.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => openLightbox(index + 1)}
            className="relative min-h-[120px] overflow-hidden rounded-2xl bg-neutral-200 sm:min-h-[156px]"
          >
            <CulturalImage
              src={url}
              alt=""
              placeName={title}
              className="absolute inset-0 size-full"
              sizes="360px"
              showFallbackCaption={false}
              dimOverlay={false}
            />
            {index === 1 && imageUrls.length > 0 ? (
              <span
                className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-sm"
                onClick={(event) => {
                  event.stopPropagation();
                  openLightbox(0);
                }}
              >
                <Camera className="h-3.5 w-3.5" aria-hidden />
                {PLACE_DETAIL_DESKTOP_GALLERY(imageUrls.length)}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {lightbox}
    </>
  );
}
