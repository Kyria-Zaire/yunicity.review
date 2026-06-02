"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { ProfileMe } from "@yunicity/types";
import {
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
  PROFILE_PORTAL_EDIT_CTA,
  PROFILE_PORTAL_ROLE_HABITANT,
  PROFILE_PORTAL_VERIFIED_LABEL,
  resolveProfilePortalHeroImage,
} from "@yunicity/utils";
import { BadgeCheck, Camera, Home, Pencil } from "lucide-react";
import Link from "next/link";

type ProfileHeroBannerProps = {
  profile: ProfileMe;
  levelTitle: string;
  subtitle: string;
  settingsHref: string;
};

export function ProfileHeroBanner({
  profile,
  levelTitle,
  subtitle,
  settingsHref,
}: ProfileHeroBannerProps) {
  const displayName = profile.display_name?.trim() || profile.username;
  const heroImage =
    resolveProfilePortalHeroImage(profile) ?? NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL;
  const avatarUrl = profile.avatar_url?.trim() || null;

  return (
    <section
      id="profile-overview"
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-neutral-200/90 bg-neutral-950 text-white shadow-sm"
    >
      <div className="relative min-h-[200px] sm:min-h-[220px]">
        <CulturalImage
          src={heroImage}
          alt=""
          placeName={profile.city ?? "Reims"}
          className="absolute inset-0 size-full"
          imageClassName="object-cover object-center"
          sizes="(max-width: 1280px) 100vw, 960px"
          priority
          showFallbackCaption={false}
          overlay={false}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20"
          aria-hidden
        />

        <Link
          href={settingsHref}
          className="absolute right-4 top-4 z-[2] inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-6 sm:top-6"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          {PROFILE_PORTAL_EDIT_CTA}
        </Link>

        <div className="relative flex flex-col gap-4 p-5 pb-6 sm:flex-row sm:items-end sm:p-6 sm:pb-7">
          <div className="relative shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-yunicity-primary shadow-lg sm:h-28 sm:w-28">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-neutral-900/80 text-white">
              <Camera className="h-4 w-4" aria-hidden />
              <span className="sr-only">Changer la photo — bientôt</span>
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h1>
              {profile.onboarding_completed ? (
                <BadgeCheck className="h-5 w-5 text-sky-300" aria-label={PROFILE_PORTAL_VERIFIED_LABEL} />
              ) : null}
            </div>
            <p className="mt-1 text-sm font-medium text-white/90">{levelTitle}</p>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/80">{subtitle}</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Home className="h-3.5 w-3.5" aria-hidden />
              {PROFILE_PORTAL_ROLE_HABITANT}
            </span>
            {profile.bio?.trim() ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85">{profile.bio}</p>
            ) : null}
            {profile.city?.trim() ? (
              <p className="mt-1 text-sm text-white/70">{profile.city.trim()}, France</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
