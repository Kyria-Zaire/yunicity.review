"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { ProfileMediumTabs } from "@/components/profile/medium/profile-medium-tabs";
import type { ProfileMe } from "@yunicity/types";
import type { ProfileDesktopTabId } from "@yunicity/utils";
import {
  INTEREST_LABELS,
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
  PROFILE_DESKTOP_BADGE_CITIZEN,
  PROFILE_DESKTOP_EDIT,
  PROFILE_DESKTOP_INTEREST_TONE,
  PROFILE_DESKTOP_MORE,
  PROFILE_DESKTOP_NEIGHBORHOOD_DEFINE,
  PROFILE_DESKTOP_NEIGHBORHOOD_LABEL,
  PROFILE_DESKTOP_NEIGHBORHOOD_UNDEFINED,
  PROFILE_DESKTOP_SHARE,
  formatProfileDesktopMemberSince,
  resolveProfileDesktopVisibilityLabel,
  resolveProfilePortalHeroImage,
} from "@yunicity/utils";
import {
  Briefcase,
  Building2,
  CalendarDays,
  Dumbbell,
  Gamepad2,
  Home,
  Laptop,
  MapPin,
  MoreHorizontal,
  Music,
  Palette,
  Pencil,
  Settings,
  Share2,
  Shield,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const TONE_CLASS = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
  sky: "bg-cyan-100 text-cyan-700",
  neutral: "bg-neutral-100 text-neutral-700",
} as const;

const INTEREST_ICON: Record<string, LucideIcon> = {
  culture: Building2,
  art: Palette,
  music: Music,
  tech: Laptop,
  gaming: Gamepad2,
  entrepreneurship: Briefcase,
  business: Briefcase,
  food: Utensils,
  nightlife: Users,
  sports: Dumbbell,
  fitness: Dumbbell,
};

type ProfileCompactHeroHeaderProps = {
  profile: ProfileMe;
  activeTab: ProfileDesktopTabId;
  onTabChange: (tab: ProfileDesktopTabId) => void;
  variant: "mobile" | "medium";
};

/** Hero profil compact — maquette mobile + medium. */
export function ProfileCompactHeroHeader({
  profile,
  activeTab,
  onTabChange,
  variant,
}: ProfileCompactHeroHeaderProps) {
  const isMobile = variant === "mobile";
  const displayName = profile.display_name?.trim() || profile.username;
  const bannerUrl = resolveProfilePortalHeroImage(profile);
  const avatarUrl = profile.avatar_url?.trim() || null;
  const city = profile.city?.trim() || "Reims";
  const memberSince = formatProfileDesktopMemberSince(profile.created_at);
  const visibilityLabel = resolveProfileDesktopVisibilityLabel(profile.visibility);
  const publicHref = `/profile/${encodeURIComponent(profile.username)}`;

  return (
    <section
      className={
        isMobile
          ? "overflow-hidden bg-white"
          : "overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      }
      data-profile-compact-hero-header=""
      data-profile-compact-hero-variant={variant}
    >
      <div
        className={`relative w-full bg-neutral-200 ${isMobile ? "h-44" : "h-36 sm:h-40"}`}
      >
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={bannerUrl}
            src={bannerUrl}
            alt=""
            className="absolute inset-0 size-full object-cover object-center"
          />
        ) : (
          <CulturalImage
            src={NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL}
            alt=""
            placeName={city}
            className="absolute inset-0 size-full"
            imageClassName="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 960px"
            priority
            showFallbackCaption={false}
          />
        )}
      </div>

      <div className={`relative pt-0 ${isMobile ? "px-4" : "px-4 sm:px-5"}`}>
        <div className={`flex gap-3.5 ${isMobile ? "" : "sm:gap-4"}`}>
          <div
            className={`shrink-0 overflow-hidden rounded-full border-[3px] border-white bg-yunicity-primary shadow-md ${
              isMobile
                ? "-mt-12 h-[5.5rem] w-[5.5rem]"
                : "-mt-10 h-[5.25rem] w-[5.25rem] sm:-mt-12"
            }`}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className={`min-w-0 flex-1 ${isMobile ? "pt-2.5" : "pt-3 sm:pt-4"}`}>
            <span className="inline-flex rounded-md bg-[#EEF0FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yunicity-primary">
              {PROFILE_DESKTOP_BADGE_CITIZEN}
            </span>
            <h1
              className={`mt-1 font-bold tracking-tight text-neutral-900 ${
                isMobile ? "text-xl" : "text-xl sm:text-2xl"
              }`}
            >
              {displayName}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">@{profile.username}</p>
          </div>
        </div>

        {profile.bio?.trim() ? (
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">{profile.bio.trim()}</p>
        ) : null}

        <p className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1.5 text-xs text-neutral-600 sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
            {city}
          </span>
          <span className="text-neutral-300" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
            {memberSince}
          </span>
        </p>

        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-neutral-600 sm:text-sm">
          <Home className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
          {PROFILE_DESKTOP_NEIGHBORHOOD_LABEL}
          <span className="text-neutral-400"> · </span>
          {PROFILE_DESKTOP_NEIGHBORHOOD_UNDEFINED}
          <span className="text-neutral-400"> · </span>
          <Link href="/profile/me/edit" className="font-semibold text-yunicity-primary hover:underline">
            {PROFILE_DESKTOP_NEIGHBORHOOD_DEFINE}
          </Link>
        </p>

        {profile.interests.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.interests.map((tag) => {
              const tone = PROFILE_DESKTOP_INTEREST_TONE[tag] ?? "neutral";
              const Icon = INTEREST_ICON[tag] ?? Users;
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASS[tone]}`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {INTEREST_LABELS[tag] ?? tag}
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4 space-y-2.5 pb-4">
          <Link
            href="/profile/me/edit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {PROFILE_DESKTOP_EDIT}
          </Link>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled
              title="Bientôt disponible"
              aria-label={PROFILE_DESKTOP_SHARE}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600"
            >
              <Share2 className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              disabled
              title="Bientôt disponible"
              aria-label={PROFILE_DESKTOP_MORE}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </button>
            <Link
              href="/settings"
              aria-label="Réglages"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50"
            >
              <Settings className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <Link
            href={publicHref}
            className="inline-flex w-full items-center justify-center gap-1.5 py-1 text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary"
          >
            <Shield className="h-4 w-4" aria-hidden />
            {visibilityLabel}
          </Link>
        </div>
      </div>

      <ProfileMediumTabs activeTab={activeTab} onChange={onTabChange} />
    </section>
  );
}
