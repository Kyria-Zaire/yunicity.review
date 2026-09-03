"use client";

import { OrganizationRequestDesktopChecklist } from "@/components/organizations/desktop/organization-request-desktop-checklist";
import type { OrganizationRequestCategoryOption, OrganizationRequestDraft } from "@yunicity/utils";
import {
  ORG_REQUEST_AFTER_SUBMIT_1,
  ORG_REQUEST_AFTER_SUBMIT_2,
  ORG_REQUEST_AFTER_SUBMIT_3,
  ORG_REQUEST_AFTER_SUBMIT_TITLE,
  ORG_REQUEST_MEDIUM_AFTER_SUBMIT_BODY,
  ORG_REQUEST_PREVIEW_ADDRESS_TBD,
  ORG_REQUEST_PREVIEW_CTA,
  ORG_REQUEST_PREVIEW_TAG_LOCAL,
  ORG_REQUEST_PREVIEW_TITLE,
  ORG_REQUEST_PREVIEW_VISUAL_PLACEHOLDER,
  ORG_REQUEST_PRIVACY,
  resolveOrganizationRequestPlaceType,
} from "@yunicity/utils";
import { Flag, ImageIcon, Info, MapPin, Search, Shield } from "lucide-react";

const BADGE_CLASS = {
  culture: "bg-violet-100 text-violet-700",
  nature: "bg-emerald-100 text-emerald-700",
  food: "bg-orange-100 text-orange-700",
  commerce: "bg-neutral-100 text-neutral-700",
  sport: "bg-sky-100 text-sky-700",
  services: "bg-amber-100 text-amber-800",
  default: "bg-neutral-100 text-neutral-600",
} as const;

const AFTER_ITEMS = [
  { icon: Search, text: ORG_REQUEST_AFTER_SUBMIT_1 },
  { icon: MapPin, text: ORG_REQUEST_AFTER_SUBMIT_2 },
  { icon: Flag, text: ORG_REQUEST_AFTER_SUBMIT_3 },
] as const;

type OrganizationRequestMediumBottomRailProps = {
  draft: OrganizationRequestDraft;
  selectedCategory: OrganizationRequestCategoryOption | null;
};

export function OrganizationRequestMediumBottomRail({
  draft,
  selectedCategory,
}: OrganizationRequestMediumBottomRailProps) {
  const title = draft.name.trim() || "Nom du lieu";
  const description =
    draft.shortDescription.trim() ||
    "Votre description apparaîtra ici dans les résultats de recherche.";
  const placeType = resolveOrganizationRequestPlaceType(draft.categoryId, draft.placeTypeId);
  const badgeLabel = selectedCategory?.badgeLabel ?? "LIEU";
  const badgeTone = selectedCategory?.badgeTone ?? "default";
  const locationLabel = draft.address.trim()
    ? `${draft.city.trim() || "Reims"} · ${draft.address.trim()}`
    : `${draft.city.trim() || "Reims"} · ${ORG_REQUEST_PREVIEW_ADDRESS_TBD}`;

  return (
    <div className="space-y-4" data-org-request-medium-rail="">
      <section className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(14rem,0.85fr)]">
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900">
            {ORG_REQUEST_PREVIEW_TITLE}
            <Info className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
          </p>

          <article className="mt-3 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
            <div className="relative flex h-36 items-center justify-center bg-[#EEF0FF] sm:h-40">
              <div className="flex flex-col items-center gap-2 px-4 text-center text-yunicity-primary/80">
                <ImageIcon className="h-7 w-7" aria-hidden />
                <p className="text-xs font-medium">{ORG_REQUEST_PREVIEW_VISUAL_PLACEHOLDER}</p>
              </div>
            </div>

            <div className="space-y-2.5 p-4">
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_CLASS[badgeTone]}`}
              >
                {badgeLabel}
              </span>
              <h3 className="text-base font-bold leading-snug text-neutral-900">{title}</h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">{description}</p>
              <p className="inline-flex items-center gap-2 text-sm text-neutral-600">
                <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                {locationLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {placeType ? (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                    {placeType.label}
                  </span>
                ) : null}
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                  {ORG_REQUEST_PREVIEW_TAG_LOCAL}
                </span>
              </div>
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-400"
              >
                {ORG_REQUEST_PREVIEW_CTA}
              </button>
            </div>
          </article>
        </div>

        <div className="min-w-0">
          <OrganizationRequestDesktopChecklist draft={draft} />
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-bold text-neutral-900">{ORG_REQUEST_AFTER_SUBMIT_TITLE}</h2>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="inline-flex max-w-xl items-start gap-2.5 text-sm leading-relaxed text-neutral-600">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
            {ORG_REQUEST_MEDIUM_AFTER_SUBMIT_BODY}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end">
            {AFTER_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.text}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-yunicity-primary" aria-hidden />
                  {item.text}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-[#C7D2FE] bg-[#EEF0FF]/60 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
          <p className="text-xs leading-relaxed text-neutral-700">{ORG_REQUEST_PRIVACY}</p>
        </div>
      </section>
    </div>
  );
}
