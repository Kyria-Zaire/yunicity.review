"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { PLACE_DETAIL_MOBILE_GALLERY } from "@yunicity/utils";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type PlaceMobileDetailGalleryProps = {
  title: string;
  imageUrls: string[];
  onRegisterOpen?: (open: (index?: number) => void) => void;
};

export function PlaceMobileDetailGallery({
  title,
  imageUrls,
  onRegisterOpen,
}: PlaceMobileDetailGalleryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setLightboxOpen(false), []);

  const openLightbox = useCallback((index = 0) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

  useEffect(() => {
    onRegisterOpen?.(openLightbox);
  }, [onRegisterOpen, openLightbox]);

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

  const handleScroll = () => {
    const node = scrollerRef.current;
    if (!node || imageUrls.length === 0) return;
    const width = node.clientWidth;
    if (width <= 0) return;
    setActiveIndex(Math.round(node.scrollLeft / width));
  };

  if (imageUrls.length === 0) return null;

  const lightbox =
    lightboxOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={PLACE_DETAIL_MOBILE_GALLERY(imageUrls.length)}
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
                src={imageUrls[activeIndex] ?? imageUrls[0]}
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

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl bg-neutral-200" data-place-mobile-detail-gallery="">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {imageUrls.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => openLightbox(index)}
              className="relative aspect-[4/3] w-full shrink-0 snap-center bg-neutral-200"
            >
              <CulturalImage
                src={url}
                alt=""
                placeName={title}
                className="absolute inset-0 size-full"
                imageClassName="object-cover"
                sizes="100vw"
                priority={index === 0}
                showFallbackCaption={false}
                dimOverlay={false}
              />
            </button>
          ))}
        </div>

        {imageUrls.length > 1 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
            {imageUrls.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                }`}
                aria-hidden
              />
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => openLightbox(activeIndex)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm"
        >
          <Camera className="h-3.5 w-3.5" aria-hidden />
          {PLACE_DETAIL_MOBILE_GALLERY(imageUrls.length)}
        </button>
      </section>
      {lightbox}
    </>
  );
}
