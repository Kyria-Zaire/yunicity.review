"use client";

import type { Tribe } from "@yunicity/types";
import type {
  TribeDetailDesktopJoinBenefit,
  TribeDetailDesktopRule,
  TribeDetailEventCard,
} from "@yunicity/utils";
import {
  TRIBE_DETAIL_DESKTOP_JOIN,
  TRIBE_DETAIL_DESKTOP_RAIL_ABOUT,
  TRIBE_DETAIL_DESKTOP_RAIL_ABOUT_ALL,
  TRIBE_DETAIL_DESKTOP_RAIL_ABOUT_PRIVATE,
  TRIBE_DETAIL_DESKTOP_RAIL_ABOUT_PUBLIC,
  TRIBE_DETAIL_DESKTOP_RAIL_CHARTER_CHECK,
  TRIBE_DETAIL_DESKTOP_RAIL_CHARTER_LINK,
  TRIBE_DETAIL_DESKTOP_RAIL_CONTACT_MODS,
  TRIBE_DETAIL_DESKTOP_RAIL_JOIN_SUBTITLE_PRIVATE,
  TRIBE_DETAIL_DESKTOP_RAIL_JOIN_SUBTITLE_PUBLIC,
  TRIBE_DETAIL_DESKTOP_RAIL_JOIN_TITLE,
  TRIBE_DETAIL_DESKTOP_RAIL_LEAVE_HINT,
  TRIBE_DETAIL_DESKTOP_RAIL_MODERATION,
  TRIBE_DETAIL_DESKTOP_RAIL_NEXT_EVENT,
  TRIBE_DETAIL_DESKTOP_RAIL_NEXT_VIEW,
  TRIBE_DETAIL_DESKTOP_RAIL_REPORT,
  TRIBE_DETAIL_DESKTOP_RAIL_RULES,
  TRIBE_DETAIL_DESKTOP_RAIL_RULES_ALL,
} from "@yunicity/utils";
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Globe,
  Info,
  MapPin,
  Megaphone,
  MessageSquare,
  Newspaper,
  Settings,
} from "lucide-react";
import { useState } from "react";

const BENEFIT_ICONS: Record<string, typeof MessageSquare> = {
  publish: MessageSquare,
  news: Newspaper,
  events: Calendar,
};

type TribeDetailDesktopRightRailProps = {
  tribe: Tribe;
  tags: string[];
  locationMeta: string;
  nextEvent: TribeDetailEventCard | null;
  joinBenefits: TribeDetailDesktopJoinBenefit[];
  rules: TribeDetailDesktopRule[];
  showJoinWidget: boolean;
  joining: boolean;
  actionError: string | null;
  onJoin: (accepted: boolean) => Promise<void>;
  onReadCharter: () => void;
  onScrollAbout: () => void;
};

export function TribeDetailDesktopRightRail({
  tribe,
  tags,
  locationMeta,
  nextEvent,
  joinBenefits,
  rules,
  showJoinWidget,
  joining,
  actionError,
  onJoin,
  onReadCharter,
  onScrollAbout,
}: TribeDetailDesktopRightRailProps) {
  const [charterAccepted, setCharterAccepted] = useState(false);
  const isPublic = tribe.visibility === "public";

  return (
    <aside className="space-y-4" data-tribe-detail-desktop-rail="">
      {showJoinWidget ? (
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900">
            {TRIBE_DETAIL_DESKTOP_RAIL_JOIN_TITLE} {tribe.name}
          </h2>
          <p className="mt-1 text-xs font-semibold text-violet-700">
            {isPublic
              ? TRIBE_DETAIL_DESKTOP_RAIL_JOIN_SUBTITLE_PUBLIC
              : TRIBE_DETAIL_DESKTOP_RAIL_JOIN_SUBTITLE_PRIVATE}
          </p>

          <ul className="mt-4 space-y-2.5">
            {joinBenefits.map((benefit) => {
              const Icon = BENEFIT_ICONS[benefit.id] ?? CheckCircle2;
              return (
                <li key={benefit.id} className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <Icon className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
                  {benefit.label}
                </li>
              );
            })}
          </ul>

          <label className="mt-5 flex items-start gap-2.5 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={charterAccepted}
              onChange={(event) => setCharterAccepted(event.target.checked)}
              className="mt-0.5"
            />
            <span>{TRIBE_DETAIL_DESKTOP_RAIL_CHARTER_CHECK}</span>
          </label>

          <button
            type="button"
            disabled={joining || !charterAccepted}
            onClick={() => void onJoin(charterAccepted)}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
          >
            {joining ? "…" : TRIBE_DETAIL_DESKTOP_JOIN}
          </button>

          <button
            type="button"
            onClick={onReadCharter}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {TRIBE_DETAIL_DESKTOP_RAIL_CHARTER_LINK}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </button>

          <p className="mt-3 text-xs text-neutral-500">{TRIBE_DETAIL_DESKTOP_RAIL_LEAVE_HINT}</p>
          {actionError ? <p className="mt-2 text-xs text-red-700">{actionError}</p> : null}
        </section>
      ) : null}

      {nextEvent ? (
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900">{TRIBE_DETAIL_DESKTOP_RAIL_NEXT_EVENT}</h2>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {nextEvent.dateBadgeDay} {nextEvent.timeLabel}
          </p>
          <p className="mt-1 text-sm font-bold text-neutral-900">{nextEvent.title}</p>
          <p className="mt-1 text-sm text-neutral-600">{nextEvent.locationLabel}</p>
          <a
            href={nextEvent.href}
            className="mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 transition hover:border-yunicity-primary hover:text-yunicity-primary"
          >
            {TRIBE_DETAIL_DESKTOP_RAIL_NEXT_VIEW}
          </a>
        </section>
      ) : null}

      <section id="tribe-about" className="tribe-detail-section rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{TRIBE_DETAIL_DESKTOP_RAIL_ABOUT}</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
          <li className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
            {isPublic ? TRIBE_DETAIL_DESKTOP_RAIL_ABOUT_PUBLIC : TRIBE_DETAIL_DESKTOP_RAIL_ABOUT_PRIVATE}
          </li>
          <li className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
            {locationMeta}
          </li>
          {tribe.description?.trim() ? (
            <li className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              <span className="line-clamp-3">{tribe.description.trim()}</span>
            </li>
          ) : null}
        </ul>
        {tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          onClick={onScrollAbout}
          className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {TRIBE_DETAIL_DESKTOP_RAIL_ABOUT_ALL}
        </button>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{TRIBE_DETAIL_DESKTOP_RAIL_RULES}</h2>
        <ul className="mt-4 space-y-2.5">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-start gap-2.5 text-sm text-neutral-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              {rule.label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onReadCharter}
          className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {TRIBE_DETAIL_DESKTOP_RAIL_RULES_ALL}
        </button>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{TRIBE_DETAIL_DESKTOP_RAIL_MODERATION}</h2>
        <ul className="mt-4 space-y-2">
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Settings className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              {TRIBE_DETAIL_DESKTOP_RAIL_CONTACT_MODS}
            </button>
          </li>
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Megaphone className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              {TRIBE_DETAIL_DESKTOP_RAIL_REPORT}
            </button>
          </li>
        </ul>
      </section>
    </aside>
  );
}
