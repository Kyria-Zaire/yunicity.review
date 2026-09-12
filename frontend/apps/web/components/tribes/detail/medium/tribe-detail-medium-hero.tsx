"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { Tribe } from "@yunicity/types";
import {
  TRIBE_DETAIL_MEDIUM_BADGE_FEATURED,
  TRIBE_DETAIL_MEDIUM_BADGE_PRIVATE,
  TRIBE_DETAIL_MEDIUM_BADGE_PUBLIC,
  TRIBE_DETAIL_MEDIUM_SAVE,
  TRIBE_DETAIL_MEDIUM_SAVE_SOON,
  TRIBE_DETAIL_MEDIUM_SHARE,
  TRIBE_DETAIL_MEDIUM_VIEW_PHOTOS,
  TRIBE_DETAIL_PORTAL_SHARE_COPIED,
  TRIBE_LEAVE_CTA,
  resolveTribeHeroImage,
} from "@yunicity/utils";
import { Bookmark, Camera, MapPin, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TribeDetailMediumHeroProps = {
  tribe: Tribe;
  tags: string[];
  locationMeta: string;
  galleryUrls: string[];
  showActions: boolean;
  isMember: boolean;
  onShare: () => void;
  onLeaveClick: () => void;
};

export function TribeDetailMediumHero({
  tribe,
  tags,
  locationMeta,
  galleryUrls,
  showActions,
  isMember,
  onShare,
  onLeaveClick,
}: TribeDetailMediumHeroProps) {
  const [shareCopied, setShareCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const imageUrl = resolveTribeHeroImage(tribe);
  const isPublic = tribe.visibility === "public";

  const badge = tribe.is_featured
    ? TRIBE_DETAIL_MEDIUM_BADGE_FEATURED
    : isPublic
      ? TRIBE_DETAIL_MEDIUM_BADGE_PUBLIC
      : TRIBE_DETAIL_MEDIUM_BADGE_PRIVATE;

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [closeLightbox, lightboxOpen]);

  async function handleShare() {
    onShare();
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2000);
  }

  const lightbox =
    lightboxOpen && mounted && galleryUrls.length > 0
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={TRIBE_DETAIL_MEDIUM_VIEW_PHOTOS}
            onClick={closeLightbox}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={galleryUrls[0] ?? imageUrl ?? ""}
              alt={tribe.name}
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <header className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <div className="relative aspect-[2.2/1] min-h-[180px] bg-neutral-100">
          {imageUrl ? (
            <CulturalImage
              src={imageUrl}
              alt={tribe.name}
              placeName={tribe.name}
              className="absolute inset-0 size-full"
              imageClassName="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 960px"
              priority
              showFallbackCaption={false}
              overlay={false}
            />
          ) : null}
          {galleryUrls.length > 0 ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-neutral-800 shadow-sm"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden />
              {TRIBE_DETAIL_MEDIUM_VIEW_PHOTOS}
            </button>
          ) : null}
        </div>

        <div className="relative px-4 pb-4 sm:px-5">
          <div className="relative -mt-9 mb-3">
            <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-neutral-100 shadow-md sm:h-[4.5rem] sm:w-[4.5rem]">
              <CulturalImage
                src={imageUrl}
                alt={tribe.name}
                placeName={tribe.name}
                className="size-full"
                sizes="72px"
                showFallbackCaption={false}
                overlay={false}
              />
            </div>
          </div>

          <p className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
            {badge}
          </p>

          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 text-xl font-bold leading-tight text-neutral-900 sm:text-2xl">
              {tribe.name}
            </h1>
            {showActions ? (
              <div className="flex shrink-0 items-center gap-1.5">
                {isMember ? (
                  <button
                    type="button"
                    onClick={onLeaveClick}
                    className="inline-flex min-h-9 items-center rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-700"
                  >
                    {TRIBE_LEAVE_CTA}
                  </button>
                ) : null}
                <button
                  type="button"
                  title={TRIBE_DETAIL_MEDIUM_SAVE_SOON}
                  disabled
                  className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-neutral-200 px-2.5 text-xs font-semibold text-neutral-400"
                >
                  <Bookmark className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">{TRIBE_DETAIL_MEDIUM_SAVE}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-neutral-200 px-2.5 text-xs font-semibold text-neutral-700"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">
                    {shareCopied ? TRIBE_DETAIL_PORTAL_SHARE_COPIED : TRIBE_DETAIL_MEDIUM_SHARE}
                  </span>
                </button>
              </div>
            ) : null}
          </div>

          {tags.length > 0 ? (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-800"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          {tribe.description?.trim() ? (
            <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">{tribe.description}</p>
          ) : null}

          <p className="mt-2 inline-flex items-center gap-1 text-sm text-neutral-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {locationMeta}
          </p>
        </div>
      </header>
      {lightbox}
    </>
  );
}
