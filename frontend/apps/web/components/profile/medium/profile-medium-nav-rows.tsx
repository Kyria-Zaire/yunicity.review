"use client";

import type { NeighborhoodContributionMeItem, ProfileMe } from "@yunicity/types";
import {
  PROFILE_MEDIUM_CONTRIB_PENDING,
  PROFILE_MEDIUM_NAV_CONTRIBUTIONS,
  PROFILE_MEDIUM_NAV_INTERESTS,
  PROFILE_MEDIUM_NAV_PRIVACY,
  PROFILE_MEDIUM_NAV_TRIBES,
} from "@yunicity/utils";
import { Building2, ChevronRight, Heart, Shield, Users } from "lucide-react";
import Link from "next/link";

type ProfileMediumNavRowsProps = {
  profile: ProfileMe;
  contributions: NeighborhoodContributionMeItem[];
  contributionsLoading: boolean;
  city: string;
};

function NavRow({
  href,
  icon: Icon,
  label,
  trailing,
}: {
  href: string;
  icon: typeof Users;
  label: string;
  trailing?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 border-b border-neutral-100 py-3.5 last:border-b-0"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">{label}</span>
        {trailing ? (
          <span className="shrink-0 text-xs font-semibold text-orange-600">{trailing}</span>
        ) : null}
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
      </Link>
    </li>
  );
}

/** Rangées navigation bas de page — maquette medium. */
export function ProfileMediumNavRows({
  profile,
  contributions,
  contributionsLoading,
  city,
}: ProfileMediumNavRowsProps) {
  const hasPendingContrib =
    !contributionsLoading && contributions.some((item) => item.status === "pending");

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white px-4 shadow-sm sm:px-5"
      data-profile-medium-nav-rows=""
    >
      <ul>
        <NavRow
          href={`/tribes?city=${encodeURIComponent(city)}`}
          icon={Users}
          label={PROFILE_MEDIUM_NAV_TRIBES}
        />
        <NavRow
          href="/neighborhoods"
          icon={Building2}
          label={PROFILE_MEDIUM_NAV_CONTRIBUTIONS}
          trailing={hasPendingContrib ? PROFILE_MEDIUM_CONTRIB_PENDING : undefined}
        />
        <NavRow
          href="/profile/me/edit"
          icon={Heart}
          label={PROFILE_MEDIUM_NAV_INTERESTS}
        />
        <NavRow href="/settings" icon={Shield} label={PROFILE_MEDIUM_NAV_PRIVACY} />
      </ul>
      {profile.interests.length === 0 ? (
        <p className="sr-only">{PROFILE_MEDIUM_NAV_INTERESTS}</p>
      ) : null}
    </section>
  );
}
