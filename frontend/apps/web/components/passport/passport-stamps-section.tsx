"use client";

import type { PassportStamp } from "@yunicity/types";
import {
  PASSPORT_STAMP_CLAIM_CTA_PARTNER,
  PASSPORT_STAMPS_EMPTY,
  PASSPORT_STAMPS_SECTION_TITLE,
  formatPassportDate,
  formatPassportStampDate,
  formatStampDisplayLine,
  formatStampSubtitle,
  partnerPublicHref,
  passportStampSourceLabel,
} from "@yunicity/utils";
import Link from "next/link";

type PassportStampsListProps = {
  stamps: PassportStamp[];
  isLoading: boolean;
};

export function PassportStampsList({ stamps, isLoading }: PassportStampsListProps) {
  return (
    <section>
      <h3 className="text-xl font-bold text-neutral-900">{PASSPORT_STAMPS_SECTION_TITLE}</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Souvenirs de vos passages et découvertes sur le territoire
      </p>
      {isLoading ? (
        <p className="mt-4 text-sm text-neutral-500">Chargement…</p>
      ) : stamps.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
          {PASSPORT_STAMPS_EMPTY}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {stamps.map((stamp) => (
            <li
              key={stamp.id}
              className="flex gap-3 rounded-xl border border-neutral-200/90 bg-white px-4 py-3 text-sm shadow-sm"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-yunicity-primary text-yunicity-primary"
                aria-hidden
              >
                {stamp.kind === "memory" ? "◇" : "✦"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">{formatStampDisplayLine(stamp)}</p>
                {formatStampSubtitle(stamp) ? (
                  <p className="text-neutral-600">{formatStampSubtitle(stamp)}</p>
                ) : null}
                <p className="text-neutral-500">{formatPassportDate(stamp.stamped_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type PassportStampsSectionProps = {
  stamps: PassportStamp[];
  isLoading: boolean;
};

export function PassportStampsSection({ stamps, isLoading }: PassportStampsSectionProps) {
  if (isLoading) {
    return (
      <section className="space-y-3">
        <h3 className="text-xl font-bold text-neutral-900">Tampons récents</h3>
        <p className="text-sm text-neutral-500">Chargement…</p>
      </section>
    );
  }

  return (
    <section className="scroll-mt-28 space-y-4" id="passport-stamps">
      <h3 className="text-xl font-bold text-neutral-900">Tampons récents</h3>
      {stamps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center">
          <p className="text-sm text-neutral-600">
            Vos premiers tampons apparaîtront ici lorsque vous visiterez un partenaire Yunicity.
          </p>
          <Link
            href="/sortir"
            className="mt-4 inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Découvrir les partenaires
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {stamps.slice(0, 5).map((stamp) => (
            <li
              key={stamp.id}
              className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-neutral-50/80 px-4 py-3"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-yunicity-primary/10" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-neutral-900">
                  {stamp.organization?.name ?? "Partenaire"}
                </p>
                <p className="text-xs text-neutral-500">
                  {stamp.stamp_source ? passportStampSourceLabel(stamp.stamp_source) : "Tampon"}
                  {" · "}
                  {formatPassportStampDate(stamp.stamped_at)}
                </p>
              </div>
              {stamp.organization && (
                <Link
                  href={partnerPublicHref({ slug: stamp.organization.slug, city: stamp.organization.city })}
                  className="shrink-0 text-xs font-semibold text-yunicity-primary hover:underline"
                >
                  {PASSPORT_STAMP_CLAIM_CTA_PARTNER}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
