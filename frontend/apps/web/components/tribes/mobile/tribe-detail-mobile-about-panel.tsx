"use client";

import type { Tribe } from "@yunicity/types";
import type { TribeDetailMobileRule } from "@yunicity/utils";
import {
  TRIBE_DETAIL_MOBILE_ABOUT_PRIVATE,
  TRIBE_DETAIL_MOBILE_ABOUT_PUBLIC,
  TRIBE_DETAIL_MOBILE_ABOUT_TITLE,
  TRIBE_DETAIL_MOBILE_CONTACT_MODS,
  TRIBE_DETAIL_MOBILE_MODERATION_TITLE,
  TRIBE_DETAIL_MOBILE_REPORT,
  TRIBE_DETAIL_MOBILE_RULES_ALL,
  TRIBE_DETAIL_MOBILE_RULES_TITLE,
} from "@yunicity/utils";
import { Globe, Info, MapPin } from "lucide-react";

import { TribeDetailMobileProjectsSection } from "./tribe-detail-mobile-projects-section";

type TribeDetailMobileAboutPanelProps = {
  tribe: Tribe;
  tags: string[];
  locationMeta: string;
  rules: TribeDetailMobileRule[];
  projectUrls: string[];
  onReadCharter: () => void;
};

export function TribeDetailMobileAboutPanel({
  tribe,
  tags,
  locationMeta,
  rules,
  projectUrls,
  onReadCharter,
}: TribeDetailMobileAboutPanelProps) {
  const isPublic = tribe.visibility === "public";

  return (
    <div id="tribe-mobile-about" className="tribe-detail-section space-y-4">
      <div id="tribe-mobile-projects">
        <TribeDetailMobileProjectsSection imageUrls={projectUrls} />
      </div>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MOBILE_ABOUT_TITLE}</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
          <li className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
            {isPublic ? TRIBE_DETAIL_MOBILE_ABOUT_PUBLIC : TRIBE_DETAIL_MOBILE_ABOUT_PRIVATE}
          </li>
          <li className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
            {locationMeta}
          </li>
          {tribe.description?.trim() ? (
            <li className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              <span>{tribe.description.trim()}</span>
            </li>
          ) : null}
        </ul>
        {tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section
        id="tribe-mobile-about-rules"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      >
        <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MOBILE_RULES_TITLE}</h2>
        <ul className="mt-4 space-y-2 text-sm text-neutral-700">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" aria-hidden />
              {rule.label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onReadCharter}
          className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {TRIBE_DETAIL_MOBILE_RULES_ALL}
        </button>
      </section>

      <section
        id="tribe-mobile-about-moderation"
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      >
        <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MOBILE_MODERATION_TITLE}</h2>
        <ul className="mt-3 space-y-1">
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-neutral-700"
            >
              {TRIBE_DETAIL_MOBILE_CONTACT_MODS}
            </button>
          </li>
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-neutral-700"
            >
              {TRIBE_DETAIL_MOBILE_REPORT}
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}
