"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PassportStamp } from "@yunicity/types";
import {
  PASSPORT_MOBILE_ACTIVITY_EMPTY,
  PASSPORT_MOBILE_ACTIVITY_TITLE,
  PASSPORT_MOBILE_ACTIVITY_VIEW_ALL,
  buildPassportMobileActivityRows,
  formatPassportMobileActivityDate,
  formatStampSubtitle,
  partnerPublicHref,
  passportStampSourceLabel,
  resolvePartnerImage,
} from "@yunicity/utils";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type PassportMobileActivityListProps = {
  stamps: PassportStamp[];
  isLoading: boolean;
};

function resolveActivitySubtitle(stamp: PassportStamp): string {
  const subtitle = formatStampSubtitle(stamp);
  if (subtitle.trim()) return subtitle;
  if (stamp.stamp_source) return passportStampSourceLabel(stamp.stamp_source);
  return "Passage enregistré";
}

export function PassportMobileActivityList({ stamps, isLoading }: PassportMobileActivityListProps) {
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(
    () => buildPassportMobileActivityRows(stamps, showAll ? 20 : 5),
    [showAll, stamps],
  );
  const hasMore = stamps.length > 5;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-base font-bold text-neutral-900">{PASSPORT_MOBILE_ACTIVITY_TITLE}</h2>
        {rows.length > 0 && hasMore && !showAll ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-yunicity-primary"
          >
            {PASSPORT_MOBILE_ACTIVITY_VIEW_ALL}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-600">
          {PASSPORT_MOBILE_ACTIVITY_EMPTY}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((stamp) => {
            const partnerName = stamp.organization?.name ?? "Partenaire";
            const partnerHref =
              stamp.organization != null
                ? partnerPublicHref({
                    slug: stamp.organization.slug,
                    city: stamp.organization.city,
                  })
                : null;

            return (
              <li key={stamp.id}>
                <Link
                  href={partnerHref ?? "/sortir"}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-3 py-3 transition hover:bg-neutral-50/80"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                    {stamp.organization ? (
                      <CulturalImage
                        src={resolvePartnerImage(
                          {
                            cover_image_url: null,
                            logo_url: stamp.organization.logo_url,
                            category: null,
                          },
                          "card",
                        )}
                        alt=""
                        placeName={partnerName}
                        className="h-full w-full object-cover"
                        sizes="44px"
                        overlay={false}
                        showFallbackCaption={false}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-500">
                        YU
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{partnerName}</p>
                    <p className="truncate text-xs text-neutral-600">{resolveActivitySubtitle(stamp)}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-[11px] text-neutral-500">
                      {formatPassportMobileActivityDate(stamp.stamped_at)}
                    </p>
                    <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
