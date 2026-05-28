"use client";

import type { PassportStamp } from "@yunicity/types";
import {
  PASSPORT_STAMPS_EMPTY,
  PASSPORT_STAMPS_SECTION_TITLE,
  formatPassportDate,
  formatStampDisplayLine,
  formatStampSubtitle,
} from "@yunicity/utils";

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
