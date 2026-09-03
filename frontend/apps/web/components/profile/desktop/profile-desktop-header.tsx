"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { ProfileDesktopTabs } from "@/components/profile/desktop/profile-desktop-tabs";
import { ProfileMediumTabs } from "@/components/profile/medium/profile-medium-tabs";
import type { ProfileDesktopProfile } from "@/components/profile/desktop/profile-desktop-profile";
import type { ProfileDesktopTabId } from "@yunicity/utils";
import {
  INTEREST_LABELS,
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
  PROFILE_DESKTOP_BADGE_CITIZEN,
  PROFILE_DESKTOP_EDIT,
  PROFILE_DESKTOP_FOLLOW,
  PROFILE_DESKTOP_FOLLOW_SOON,
  PROFILE_DESKTOP_INTEREST_TONE,
  PROFILE_DESKTOP_MESSAGE,
  PROFILE_DESKTOP_MESSAGE_SOON,
  PROFILE_DESKTOP_MORE,
  PROFILE_DESKTOP_SETTINGS,
  PROFILE_DESKTOP_SHARE,
  PROFILE_DESKTOP_SHARE_ACTION,
  formatProfileDesktopMemberSince,
  resolveProfilePortalHeroImage,
} from "@yunicity/utils";
import {
  Briefcase,
  Building2,
  CalendarDays,
  Dumbbell,
  Gamepad2,
  Laptop,
  MapPin,
  MoreHorizontal,
  Music,
  Palette,
  Pencil,
  Send,
  Settings,
  Share2,
  UserPlus,
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
  photography: Palette,
};

type ProfileDesktopHeaderProps = {
  profile: ProfileDesktopProfile;
  activeTab: ProfileDesktopTabId;
  onTabChange: (tab: ProfileDesktopTabId) => void;
  /** owner = /profile/me · visitor = profil public d'un autre citoyen */
  mode?: "owner" | "visitor";
  /** desktop = onglets intégrés desktop · medium = onglets scrollables medium */
  tabLayout?: "desktop" | "medium";
  /** mobile = header plein écran sans carte · actions visiteur empilées */
  headerLayout?: "desktop" | "medium" | "mobile";
};

/** Header cover + identité + tabs — maquette 1. */
export function ProfileDesktopHeader({
  profile,
  activeTab,
  onTabChange,
  mode = "owner",
  tabLayout = "desktop",
  headerLayout = "desktop",
}: ProfileDesktopHeaderProps) {
  const displayName = profile.display_name?.trim() || profile.username;
  const bannerUrl = resolveProfilePortalHeroImage(profile);
  const avatarUrl = profile.avatar_url?.trim() || null;
  const city = profile.city?.trim() || "Reims";
  const memberSince = profile.created_at
    ? formatProfileDesktopMemberSince(profile.created_at)
    : null;
  const isVisitor = mode === "visitor";
  const isMobileHeader = headerLayout === "mobile";

  return (
    <section
      className={
        isMobileHeader
          ? "overflow-hidden bg-white"
          : "overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      }
      data-profile-desktop-header=""
    >
      <div className="relative h-36 w-full bg-neutral-200 sm:h-44 lg:h-48">
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
            sizes="(max-width: 1400px) 100vw, 1200px"
            priority
            showFallbackCaption={false}
          />
        )}
      </div>

      <div className="relative px-5 pb-0 sm:px-6">
        {/* Avatar only overlaps the cover; identity stays fully below the banner. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
            <div className="-mt-10 h-[5.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-full border-[3px] border-white bg-yunicity-primary shadow-md sm:-mt-12 sm:h-[6.5rem] sm:w-[6.5rem]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-3 sm:pt-4">
              <span className="inline-flex rounded-md bg-[#EEF0FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yunicity-primary">
                {PROFILE_DESKTOP_BADGE_CITIZEN}
              </span>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
                {displayName}
              </h1>
              <p className="mt-0.5 text-sm text-neutral-500">@{profile.username}</p>
              {profile.bio?.trim() ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-700">
                  {profile.bio.trim()}
                </p>
              ) : null}

              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-neutral-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
                  {city}
                </span>
                {memberSince ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
                    {memberSince}
                  </span>
                ) : null}
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
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto lg:min-w-[15rem] lg:pt-3">
            {isVisitor ? (
              isMobileHeader ? (
                <div className="flex w-full flex-col gap-2">
                  <button
                    type="button"
                    disabled
                    title={PROFILE_DESKTOP_FOLLOW_SOON}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white opacity-90"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden />
                    {PROFILE_DESKTOP_FOLLOW}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      title={PROFILE_DESKTOP_MESSAGE_SOON}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800"
                    >
                      <Send className="h-4 w-4" aria-hidden />
                      {PROFILE_DESKTOP_MESSAGE}
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Bientôt disponible"
                      aria-label={PROFILE_DESKTOP_SHARE_ACTION}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500"
                    >
                      <Share2 className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Bientôt disponible"
                      aria-label={PROFILE_DESKTOP_MORE}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500"
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              ) : (
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <button
                  type="button"
                  disabled
                  title={PROFILE_DESKTOP_FOLLOW_SOON}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white opacity-90 sm:flex-none"
                >
                  <UserPlus className="h-4 w-4" aria-hidden />
                  {PROFILE_DESKTOP_FOLLOW}
                </button>
                <button
                  type="button"
                  disabled
                  title={PROFILE_DESKTOP_MESSAGE_SOON}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 sm:flex-none"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  {PROFILE_DESKTOP_MESSAGE}
                </button>
                <button
                  type="button"
                  disabled
                  title="Bientôt disponible"
                  aria-label={PROFILE_DESKTOP_SHARE_ACTION}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500"
                >
                  <Share2 className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled
                  title="Bientôt disponible"
                  aria-label={PROFILE_DESKTOP_MORE}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </button>
              </div>
              )
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Link
                    href="/profile/me/edit"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 sm:flex-none"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                    {PROFILE_DESKTOP_EDIT}
                  </Link>
                  <button
                    type="button"
                    disabled
                    title="Bientôt disponible"
                    aria-label={PROFILE_DESKTOP_SHARE}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500"
                  >
                    <Share2 className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Bientôt disponible"
                    aria-label={PROFILE_DESKTOP_MORE}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500"
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <Link
                  href="/settings"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                >
                  <Settings className="h-4 w-4" aria-hidden />
                  {PROFILE_DESKTOP_SETTINGS}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-5">
          {tabLayout === "medium" ? (
            <ProfileMediumTabs
              activeTab={activeTab}
              onChange={onTabChange}
              variant={isVisitor ? "public" : "owner"}
            />
          ) : (
            <ProfileDesktopTabs
              activeTab={activeTab}
              onChange={onTabChange}
              variant={isVisitor ? "public" : "owner"}
            />
          )}
        </div>
      </div>
    </section>
  );
}
