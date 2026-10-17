"use client";

import type { OrganizationRequestCategoryOption, OrganizationRequestDraft } from "@yunicity/utils";
import {
  ORG_REQUEST_PREVIEW_ADDRESS_TBD,
  ORG_REQUEST_PREVIEW_CTA,
  ORG_REQUEST_PREVIEW_MODE_CARD,
  ORG_REQUEST_PREVIEW_MODE_DETAIL,
  ORG_REQUEST_PREVIEW_TAG_LOCAL,
  ORG_REQUEST_PREVIEW_TITLE,
  ORG_REQUEST_PREVIEW_VISUAL_PLACEHOLDER,
  resolveOrganizationRequestPlaceType,
} from "@yunicity/utils";
import { ImageIcon, Info, MapPin } from "lucide-react";
import { useState } from "react";

const BADGE_CLASS = {
  culture: "bg-violet-100 text-violet-700",
  nature: "bg-emerald-100 text-emerald-700",
  food: "bg-orange-100 text-orange-700",
  commerce: "bg-neutral-100 text-neutral-700",
  sport: "bg-sky-100 text-sky-700",
  services: "bg-amber-100 text-amber-800",
  default: "bg-neutral-100 text-neutral-600",
} as const;

type OrganizationRequestDesktopPreviewProps = {
  draft: OrganizationRequestDraft;
  selectedCategory: OrganizationRequestCategoryOption | null;
};

export function OrganizationRequestDesktopPreview({
  draft,
  selectedCategory,
}: OrganizationRequestDesktopPreviewProps) {
  const [mode, setMode] = useState<"card" | "detail">("card");
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
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-org-request-desktop-preview=""
    >
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900">
          {ORG_REQUEST_PREVIEW_TITLE}
          <Info className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
        </p>
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("card")}
            className={`rounded-md px-2.5 py-1 transition ${
              mode === "card" ? "bg-yunicity-primary text-white shadow-sm" : "text-neutral-500"
            }`}
          >
            {ORG_REQUEST_PREVIEW_MODE_CARD}
          </button>
          <button
            type="button"
            onClick={() => setMode("detail")}
            className={`rounded-md px-2.5 py-1 transition ${
              mode === "detail" ? "bg-yunicity-primary text-white shadow-sm" : "text-neutral-500"
            }`}
          >
            {ORG_REQUEST_PREVIEW_MODE_DETAIL}
          </button>
        </div>
      </div>

      <article className="mt-3 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <div className="relative flex h-36 items-center justify-center bg-[#EEF0FF]">
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

      {mode === "detail" ? (
        <p className="sr-only">Mode détail — aperçu enrichi à venir.</p>
      ) : null}
    </section>
  );
}
