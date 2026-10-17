"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { Tribe } from "@yunicity/types";
import {
  TRIBE_DETAIL_DESKTOP_BADGE_FEATURED,
  TRIBE_DETAIL_DESKTOP_BADGE_PRIVATE,
  TRIBE_DETAIL_DESKTOP_BADGE_PUBLIC,
  TRIBE_DETAIL_DESKTOP_JOIN,
  TRIBE_DETAIL_DESKTOP_MORE,
  TRIBE_DETAIL_DESKTOP_SAVE,
  TRIBE_DETAIL_DESKTOP_SAVE_SOON,
  TRIBE_DETAIL_DESKTOP_SHARE,
  TRIBE_DETAIL_DESKTOP_VIEW_PHOTOS,
  TRIBE_DETAIL_PORTAL_SHARE_COPIED,
  TRIBE_LEAVE_CTA,
  resolveTribeHeroImage,
} from "@yunicity/utils";
import { Bookmark, Camera, Ellipsis, MapPin, Share2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TribeDetailDesktopHeroProps = {
  tribe: Tribe;
  city: string;
  tags: string[];
  locationMeta: string;
  galleryUrls: string[];
  showActions: boolean;
  isAuthenticated: boolean;
  isMember: boolean;
  joining: boolean;
  onJoinClick: () => void;
  onShare: () => void;
  onLeaveClick: () => void;
};

export function TribeDetailDesktopHero({
  tribe,
  city,
  tags,
  locationMeta,
  galleryUrls,
  showActions,
  isAuthenticated,
  isMember,
  joining,
  onJoinClick,
  onShare,
  onLeaveClick,
}: TribeDetailDesktopHeroProps) {
  const [shareCopied, setShareCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const imageUrl = resolveTribeHeroImage(tribe);
  const isPublic = tribe.visibility === "public";

  const badge = tribe.is_featured
    ? TRIBE_DETAIL_DESKTOP_BADGE_FEATURED
    : isPublic
      ? TRIBE_DETAIL_DESKTOP_BADGE_PUBLIC
      : TRIBE_DETAIL_DESKTOP_BADGE_PRIVATE;

  const loginNext = `/tribes/${encodeURIComponent(tribe.slug)}?city=${encodeURIComponent(city)}`;

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
            aria-label={TRIBE_DETAIL_DESKTOP_VIEW_PHOTOS}
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
        <div className="relative aspect-[2.4/1] min-h-[200px] bg-neutral-100">
          {imageUrl ? (
            <CulturalImage
              src={imageUrl}
              alt={tribe.name}
              placeName={tribe.name}
              className="absolute inset-0 size-full"
              imageClassName="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 900px"
              priority
              showFallbackCaption={false}
              overlay={false}
            />
          ) : null}
          {galleryUrls.length > 0 ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden />
              {TRIBE_DETAIL_DESKTOP_VIEW_PHOTOS}
            </button>
          ) : null}
        </div>

        <div className="relative px-5 pb-5 pt-0 sm:px-6">
          <div className="relative -mt-10 mb-4 flex items-end gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-neutral-100 shadow-md sm:h-24 sm:w-24">
              <CulturalImage
                src={imageUrl}
                alt={tribe.name}
                placeName={tribe.name}
                className="size-full"
                sizes="96px"
                showFallbackCaption={false}
                overlay={false}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-800">
              {badge}
            </p>
            <h1 className="text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">{tribe.name}</h1>

            {tags.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}

            {tribe.description?.trim() ? (
              <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">{tribe.description}</p>
            ) : null}

            <p className="inline-flex items-center gap-1.5 text-sm text-neutral-500">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {locationMeta}
            </p>

            {showActions ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {!isMember ? (
                  isAuthenticated ? (
                    <button
                      type="button"
                      disabled={joining}
                      onClick={onJoinClick}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-yunicity-primary px-5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
                    >
                      {joining ? "…" : TRIBE_DETAIL_DESKTOP_JOIN}
                    </button>
                  ) : (
                    <Link
                      href={`/login?next=${encodeURIComponent(loginNext)}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-yunicity-primary px-5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
                    >
                      {TRIBE_DETAIL_DESKTOP_JOIN}
                    </Link>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={onLeaveClick}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-neutral-200 px-5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300"
                  >
                    {TRIBE_LEAVE_CTA}
                  </button>
                )}

                <button
                  type="button"
                  title={TRIBE_DETAIL_DESKTOP_SAVE_SOON}
                  disabled
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-400"
                >
                  <Bookmark className="h-4 w-4" aria-hidden />
                  {TRIBE_DETAIL_DESKTOP_SAVE}
                </button>

                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300"
                >
                  <Share2 className="h-4 w-4" aria-hidden />
                  {shareCopied ? TRIBE_DETAIL_PORTAL_SHARE_COPIED : TRIBE_DETAIL_DESKTOP_SHARE}
                </button>

                <button
                  type="button"
                  aria-label={TRIBE_DETAIL_DESKTOP_MORE}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:border-neutral-300"
                >
                  <Ellipsis className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {lightbox}
    </>
  );
}
