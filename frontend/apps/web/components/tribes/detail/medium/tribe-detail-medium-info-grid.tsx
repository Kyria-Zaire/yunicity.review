"use client";

import type { Tribe } from "@yunicity/types";
import type { TribeDetailMediumRule } from "@yunicity/utils";
import {
  TRIBE_DETAIL_MEDIUM_ABOUT,
  TRIBE_DETAIL_MEDIUM_ABOUT_ALL,
  TRIBE_DETAIL_MEDIUM_ABOUT_PRIVATE,
  TRIBE_DETAIL_MEDIUM_ABOUT_PUBLIC,
  TRIBE_DETAIL_MEDIUM_CONTACT_MODS,
  TRIBE_DETAIL_MEDIUM_MODERATION,
  TRIBE_DETAIL_MEDIUM_REPORT,
  TRIBE_DETAIL_MEDIUM_RULES,
  TRIBE_DETAIL_MEDIUM_RULES_ALL,
} from "@yunicity/utils";
import { CheckCircle2, Globe, Info, MapPin, Megaphone, Settings } from "lucide-react";

type TribeDetailMediumInfoGridProps = {
  tribe: Tribe;
  tags: string[];
  locationMeta: string;
  rules: TribeDetailMediumRule[];
  onReadCharter: () => void;
  onScrollAbout: () => void;
};

export function TribeDetailMediumInfoGrid({
  tribe,
  tags,
  locationMeta,
  rules,
  onReadCharter,
  onScrollAbout,
}: TribeDetailMediumInfoGridProps) {
  const isPublic = tribe.visibility === "public";

  return (
    <section
      id="tribe-medium-about"
      className="tribe-detail-section grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-tribe-detail-medium-info-grid=""
    >
      <article className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{TRIBE_DETAIL_MEDIUM_ABOUT}</h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          <li className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
            {isPublic ? TRIBE_DETAIL_MEDIUM_ABOUT_PUBLIC : TRIBE_DETAIL_MEDIUM_ABOUT_PRIVATE}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
            {locationMeta}
          </li>
          {tribe.description?.trim() ? (
            <li className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              <span className="line-clamp-4">{tribe.description.trim()}</span>
            </li>
          ) : null}
        </ul>
        {tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          onClick={onScrollAbout}
          className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {TRIBE_DETAIL_MEDIUM_ABOUT_ALL}
        </button>
      </article>

      <article className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{TRIBE_DETAIL_MEDIUM_RULES}</h2>
        <ul className="mt-3 space-y-2">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-start gap-2 text-sm text-neutral-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              {rule.label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onReadCharter}
          className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {TRIBE_DETAIL_MEDIUM_RULES_ALL}
        </button>
      </article>

      <article className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1">
        <h2 className="text-sm font-bold text-neutral-900">{TRIBE_DETAIL_MEDIUM_MODERATION}</h2>
        <ul className="mt-3 space-y-1">
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Settings className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              {TRIBE_DETAIL_MEDIUM_CONTACT_MODS}
            </button>
          </li>
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Megaphone className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              {TRIBE_DETAIL_MEDIUM_REPORT}
            </button>
          </li>
        </ul>
      </article>
    </section>
  );
}
