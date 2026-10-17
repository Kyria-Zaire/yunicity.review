"use client";

import type { NeighborhoodContributionMeItem, ProfileMe } from "@yunicity/types";
import type { PassportLevelView, ProfileDesktopTribeRailItem } from "@yunicity/utils";
import {
  PROFILE_DESKTOP_CONTRIB_APPROVED,
  PROFILE_DESKTOP_CONTRIB_CTA,
  PROFILE_DESKTOP_CONTRIB_EMPTY,
  PROFILE_DESKTOP_CONTRIB_PENDING,
  PROFILE_DESKTOP_CONTRIB_REJECTED,
  PROFILE_DESKTOP_CONTRIB_TITLE,
  PROFILE_DESKTOP_LOCAL_CITY,
  PROFILE_DESKTOP_LOCAL_CTA,
  PROFILE_DESKTOP_LOCAL_INTERESTS,
  PROFILE_DESKTOP_LOCAL_INTERESTS_EMPTY,
  PROFILE_DESKTOP_LOCAL_INTERESTS_SET,
  PROFILE_DESKTOP_LOCAL_NEIGHBORHOOD,
  PROFILE_DESKTOP_LOCAL_TITLE,
  PROFILE_DESKTOP_NEIGHBORHOOD_UNDEFINED,
  PROFILE_DESKTOP_PASSPORT_CTA,
  PROFILE_DESKTOP_PASSPORT_PROGRESS,
  PROFILE_DESKTOP_PASSPORT_TITLE,
  PROFILE_DESKTOP_PRIVACY_ACCOUNT,
  PROFILE_DESKTOP_PRIVACY_BLOCKED,
  PROFILE_DESKTOP_PRIVACY_CTA,
  PROFILE_DESKTOP_PRIVACY_TITLE,
  PROFILE_DESKTOP_PRIVACY_VISIBILITY,
  PROFILE_DESKTOP_TRIBES_CTA,
  PROFILE_DESKTOP_TRIBES_EMPTY,
  PROFILE_DESKTOP_TRIBES_MEMBER,
  PROFILE_DESKTOP_TRIBES_PENDING,
  PROFILE_DESKTOP_TRIBES_TITLE,
  resolveProfileDesktopPassportSteps,
} from "@yunicity/utils";
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  Flag,
  Globe2,
  Heart,
  Home,
  Lock,
  MapPin,
  ShieldBan,
  Users,
} from "lucide-react";
import Link from "next/link";

type ProfileDesktopRailProps = {
  profile: ProfileMe;
  levelView: PassportLevelView | null;
  tribeItems: ProfileDesktopTribeRailItem[];
  contributions: NeighborhoodContributionMeItem[];
  contributionsLoading: boolean;
  city: string;
};

function contribStatusLabel(status: NeighborhoodContributionMeItem["status"]): string {
  if (status === "approved") return PROFILE_DESKTOP_CONTRIB_APPROVED;
  if (status === "rejected") return PROFILE_DESKTOP_CONTRIB_REJECTED;
  return PROFILE_DESKTOP_CONTRIB_PENDING;
}

function contribStatusClass(status: NeighborhoodContributionMeItem["status"]): string {
  if (status === "approved") return "text-emerald-600";
  if (status === "rejected") return "text-red-600";
  return "text-orange-600";
}

/** Rail droit profil desktop — local / passport / tribus / contrib / privacy. */
export function ProfileDesktopRail({
  profile,
  levelView,
  tribeItems,
  contributions,
  contributionsLoading,
  city,
}: ProfileDesktopRailProps) {
  const steps = resolveProfileDesktopPassportSteps(levelView);
  const interestsSet = profile.interests.length > 0;
  const visibleContribs = contributions.slice(0, 3);

  return (
    <aside className="space-y-4" data-profile-desktop-rail="">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_DESKTOP_LOCAL_TITLE}</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-2 text-neutral-500">
              <MapPin className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
              {PROFILE_DESKTOP_LOCAL_CITY}
            </dt>
            <dd className="font-semibold text-neutral-900">{city}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-2 text-neutral-500">
              <Home className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
              {PROFILE_DESKTOP_LOCAL_NEIGHBORHOOD}
            </dt>
            <dd className="font-semibold text-neutral-500">{PROFILE_DESKTOP_NEIGHBORHOOD_UNDEFINED}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-2 text-neutral-500">
              <Heart className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
              {PROFILE_DESKTOP_LOCAL_INTERESTS}
            </dt>
            <dd className="font-semibold text-neutral-900">
              {interestsSet
                ? PROFILE_DESKTOP_LOCAL_INTERESTS_SET
                : PROFILE_DESKTOP_LOCAL_INTERESTS_EMPTY}
            </dd>
          </div>
        </dl>
        <Link
          href="/profile/me/edit"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-yunicity-primary px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
        >
          {PROFILE_DESKTOP_LOCAL_CTA}
        </Link>
      </section>

      <section className="rounded-2xl bg-yunicity-primary p-4 text-white shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Globe2 className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold">{PROFILE_DESKTOP_PASSPORT_TITLE}</h2>
            <p className="text-sm text-white/90">{steps.levelLabel}</p>
            <div className="mt-2.5 flex items-center justify-between gap-2 text-xs font-medium text-white/90">
              <span>{PROFILE_DESKTOP_PASSPORT_PROGRESS(steps.done, steps.total)}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-[width]"
                style={{ width: `${steps.percent}%` }}
              />
            </div>
          </div>
        </div>
        <Link
          href="/passport"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-white/95"
        >
          {PROFILE_DESKTOP_PASSPORT_CTA}
        </Link>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_DESKTOP_TRIBES_TITLE}</h2>
        {tribeItems.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">{PROFILE_DESKTOP_TRIBES_EMPTY}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {tribeItems.map((tribe) => (
              <li key={tribe.id} className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={tribe.href}
                    className="block truncate text-sm font-semibold text-neutral-900 hover:text-yunicity-primary"
                  >
                    {tribe.name}
                  </Link>
                  <p
                    className={`text-xs font-medium ${
                      tribe.status === "member" ? "text-emerald-600" : "text-orange-600"
                    }`}
                  >
                    {tribe.status === "member"
                      ? PROFILE_DESKTOP_TRIBES_MEMBER
                      : PROFILE_DESKTOP_TRIBES_PENDING}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/tribes?city=${encodeURIComponent(city)}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PROFILE_DESKTOP_TRIBES_CTA}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_DESKTOP_CONTRIB_TITLE}</h2>
        {contributionsLoading ? (
          <p className="mt-3 text-sm text-neutral-500" role="status">
            Chargement…
          </p>
        ) : visibleContribs.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">{PROFILE_DESKTOP_CONTRIB_EMPTY}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {visibleContribs.map((item) => {
              const title =
                item.title?.trim() ||
                item.neighborhood.display_name ||
                item.body.slice(0, 48).trim() ||
                "Contribution";
              return (
                <li key={item.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                    {item.status === "approved" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Flag className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{title}</p>
                    <p className={`text-xs font-medium ${contribStatusClass(item.status)}`}>
                      {contribStatusLabel(item.status)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/neighborhoods"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PROFILE_DESKTOP_CONTRIB_CTA}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_DESKTOP_PRIVACY_TITLE}</h2>
        <ul className="mt-2">
          <li>
            <Link
              href="/settings"
              className="flex items-center justify-between gap-2 rounded-lg px-1 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50"
            >
              <span className="inline-flex items-center gap-2.5">
                <Eye className="h-4 w-4 text-neutral-400" aria-hidden />
                {PROFILE_DESKTOP_PRIVACY_VISIBILITY}
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-300" aria-hidden />
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              className="flex items-center justify-between gap-2 rounded-lg px-1 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50"
            >
              <span className="inline-flex items-center gap-2.5">
                <Lock className="h-4 w-4 text-neutral-400" aria-hidden />
                {PROFILE_DESKTOP_PRIVACY_ACCOUNT}
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-300" aria-hidden />
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              className="flex items-center justify-between gap-2 rounded-lg px-1 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50"
            >
              <span className="inline-flex items-center gap-2.5">
                <ShieldBan className="h-4 w-4 text-neutral-400" aria-hidden />
                {PROFILE_DESKTOP_PRIVACY_BLOCKED}
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-300" aria-hidden />
            </Link>
          </li>
        </ul>
        <Link
          href="/settings"
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-yunicity-primary px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
        >
          {PROFILE_DESKTOP_PRIVACY_CTA} →
        </Link>
      </section>
    </aside>
  );
}
