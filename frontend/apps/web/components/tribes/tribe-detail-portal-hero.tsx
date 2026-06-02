"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { TribeActions } from "@/components/tribes/tribe-actions";
import type { Tribe } from "@yunicity/types";
import type { TribeDetailQuickStat } from "@yunicity/utils";
import {
  TRIBE_DETAIL_HERO_SHARE,
  TRIBE_DETAIL_PORTAL_BADGE,
  TRIBE_DETAIL_PORTAL_BADGE_FEATURED,
  TRIBE_DETAIL_PORTAL_SHARE_COPIED,
  resolveTribeHeroImage,
} from "@yunicity/utils";
import { BadgeCheck, Share2 } from "lucide-react";
import { useState } from "react";

type TribeDetailPortalHeroProps = {
  tribe: Tribe;
  heroMeta: string;
  tags: string[];
  stats: TribeDetailQuickStat[];
  showActions: boolean;
  joining: boolean;
  leaving: boolean;
  actionError: string | null;
  isAuthenticated: boolean;
  onJoin: (accepted: boolean) => Promise<void>;
  onLeave: () => Promise<void>;
  onShare: () => void;
};

export function TribeDetailPortalHero({
  tribe,
  heroMeta,
  tags,
  stats,
  showActions,
  joining,
  leaving,
  actionError,
  isAuthenticated,
  onJoin,
  onLeave,
  onShare,
}: TribeDetailPortalHeroProps) {
  const [shareCopied, setShareCopied] = useState(false);
  const imageUrl = resolveTribeHeroImage(tribe);
  const badge = tribe.is_featured ? TRIBE_DETAIL_PORTAL_BADGE_FEATURED : TRIBE_DETAIL_PORTAL_BADGE;

  async function handleShare() {
    onShare();
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2000);
  }

  return (
    <header className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-lg ring-1 ring-neutral-900/10">
      <div className="relative min-h-[300px] sm:min-h-[340px]">
        <CulturalImage
          src={imageUrl}
          alt={tribe.name}
          placeName={tribe.name}
          className="absolute inset-0 size-full"
          imageClassName="object-cover object-center"
          sizes="(max-width: 1280px) 100vw, 1100px"
          priority
          showFallbackCaption={false}
          overlay={false}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/88 to-neutral-950/25"
          aria-hidden
        />

        <div className="relative flex h-full flex-col justify-between gap-6 p-5 sm:p-7 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1 lg:max-w-[58%]">
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white/90 bg-neutral-800 shadow-lg sm:h-24 sm:w-24">
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
              <div className="min-w-0 pt-1">
                <p className="inline-flex rounded-full bg-yunicity-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  {badge}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{tribe.name}</h1>
                  {tribe.is_featured ? (
                    <BadgeCheck className="h-5 w-5 shrink-0 text-sky-300" aria-label="Tribu mise en avant" />
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-white/75">{heroMeta}</p>
              </div>
            </div>

            {tribe.description?.trim() ? (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85">{tribe.description}</p>
            ) : null}

            {tags.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}

            {showActions ? (
              <div className="mt-5" id="actions-tribu">
                <TribeActions
                  tribe={tribe}
                  joining={joining}
                  leaving={leaving}
                  actionError={actionError}
                  onJoin={onJoin}
                  onLeave={onLeave}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-black/30 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                {shareCopied ? TRIBE_DETAIL_PORTAL_SHARE_COPIED : TRIBE_DETAIL_HERO_SHARE}
              </button>
            </div>

            {stats.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/15 bg-white/95 p-3 text-neutral-900 shadow-xl sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.id} className="rounded-xl bg-neutral-50 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
