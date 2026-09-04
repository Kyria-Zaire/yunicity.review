"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { EVENT_DETAIL_DESKTOP_GALLERY } from "@yunicity/utils";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type EventDesktopHeroProps = {
  title: string;
  imageUrls: string[];
  compact?: boolean;
  galleryLabel?: (count: number) => string;
};

export function EventDesktopHero({
  title,
  imageUrls,
  compact = false,
  galleryLabel = EVENT_DETAIL_DESKTOP_GALLERY,
}: EventDesktopHeroProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const hero = imageUrls[0] ?? null;
  const showGalleryCta = compact ? imageUrls.length > 0 : imageUrls.length > 1;

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
      if (event.key === "ArrowRight") {
        setActiveIndex((i) => (i + 1) % imageUrls.length);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [close, imageUrls.length, lightboxOpen]);

  const lightbox =
    lightboxOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={galleryLabel(imageUrls.length)}
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
                src={imageUrls[activeIndex] ?? hero ?? ""}
                alt={title}
                className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain"
              />
              {imageUrls.length > 1 ? (
                <>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length)
                      }
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
                </>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-neutral-200" data-event-desktop-hero="">
        <div className={`relative w-full ${compact ? "aspect-[16/10] min-h-[180px]" : "aspect-[21/9] min-h-[220px] sm:aspect-[2.2/1]"}`}>
          {hero ? (
            <CulturalImage
              src={hero}
              alt=""
              placeName={title}
              className="absolute inset-0 size-full"
              sizes="(max-width: 1280px) 100vw, 900px"
              showFallbackCaption={false}
              dimOverlay={false}
              priority
            />
          ) : null}
        </div>
        {showGalleryCta ? (
          <button
            type="button"
            onClick={() => {
              setActiveIndex(0);
              setLightboxOpen(true);
            }}
            className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden />
            {galleryLabel(imageUrls.length)}
          </button>
        ) : null}
      </div>
      {lightbox}
    </>
  );
}
