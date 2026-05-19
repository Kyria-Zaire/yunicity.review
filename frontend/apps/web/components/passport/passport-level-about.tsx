import type { PassportMe } from "@yunicity/types";
import {
  PASSPORT_LEVEL_ABOUT_TITLE,
  PASSPORT_LEVEL_PROGRESS_HINT,
  PASSPORT_TIER_META,
  PASSPORT_TIER_SIGNIFICANCE,
  formatPassportProgressionHint,
} from "@yunicity/utils";

export function PassportLevelAbout({ passport }: { passport: PassportMe }) {
  const tier = PASSPORT_TIER_META[passport.tier.code];
  const significance = PASSPORT_TIER_SIGNIFICANCE[passport.tier.code];
  const progressionText = formatPassportProgressionHint(
    passport.progression?.hint,
    passport.progression?.points_to_next,
  );

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-900">{PASSPORT_LEVEL_ABOUT_TITLE}</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold"
          style={{
            borderColor: tier.border,
            color: tier.accent,
            backgroundColor: tier.accentMuted,
          }}
        >
          {tier.label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">{significance}</p>
      <p className="mt-2 text-xs text-neutral-500">{PASSPORT_LEVEL_PROGRESS_HINT}</p>
      {progressionText ? (
        <p className="mt-3 text-sm text-neutral-600">{progressionText}</p>
      ) : null}
      {passport.progression?.next_tier_label && passport.progression.points_to_next != null ? (
        <p className="mt-2 text-xs text-neutral-500">
          Prochain palier : {passport.progression.next_tier_label}
        </p>
      ) : null}
    </section>
  );
}
