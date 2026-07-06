"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_MOBILE_EVENT_BADGE,
  EVENT_DETAIL_SHARE,
  formatEventMobileLocationSubtitle,
  resolveEventHeroImage,
} from "@yunicity/utils";
import { ArrowLeft, Heart, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";

type EventMobileDetailHeroProps = {
  event: LocalEvent;
  culturalPlaces: CulturalPlaceListItem[];
  interestedByMe: boolean;
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
  onShare: () => void;
};

/** Hero plein écran détail événement mobile (MOBILE-SORTIR-02). */
export function EventMobileDetailHero({
  event,
  culturalPlaces,
  interestedByMe,
  toggling,
  isAuthenticated,
  onToggleInterest,
  onShare,
}: EventMobileDetailHeroProps) {
  const router = useRouter();
  const imageUrl = resolveEventHeroImage(event, culturalPlaces);
  const locationLine = formatEventMobileLocationSubtitle(event);

  return (
    <section className="relative min-h-[320px] overflow-hidden bg-neutral-900">
      <CulturalImage
        src={imageUrl}
        alt={event.title}
        placeName={event.title}
        className="absolute inset-0 h-full w-full"
        sizes="100vw"
        priority
        showFallbackCaption={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/50 to-neutral-900/20" />

      <div className="relative flex min-h-[320px] flex-col pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => router.push("/sortir")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/45"
            aria-label="Retour à Sortir"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/45"
              aria-label={EVENT_DETAIL_SHARE}
            >
              <Share2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              disabled={toggling}
              onClick={() => {
                if (!isAuthenticated) {
                  router.push("/login");
                  return;
                }
                onToggleInterest();
              }}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition disabled:opacity-60 ${
                interestedByMe
                  ? "bg-yunicity-primary text-white"
                  : "border border-white/40 bg-black/30 text-white hover:bg-black/45"
              }`}
              aria-label={interestedByMe ? "Retirer de mes intérêts" : "Marquer comme intéressé"}
              aria-pressed={interestedByMe}
            >
              <Heart
                className={`h-4 w-4 ${interestedByMe ? "fill-current" : ""}`}
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>
        </div>

        <div className="mt-auto px-4 pb-10 pt-6">
          <span className="inline-flex rounded-full bg-yunicity-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {EVENT_DETAIL_MOBILE_EVENT_BADGE}
          </span>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-white">{event.title}</h1>
          <p className="mt-2 text-sm text-white/90">{locationLine}</p>
        </div>
      </div>
    </section>
  );
}
