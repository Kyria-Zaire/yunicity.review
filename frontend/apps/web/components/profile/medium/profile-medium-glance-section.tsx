"use client";

import { ProfileDesktopGlance } from "@/components/profile/desktop/profile-desktop-glance";
import type { PassportLevelView, ProfileDesktopGlanceOuting, ProfileDesktopTribeRailItem } from "@yunicity/utils";
import { PROFILE_MEDIUM_GLANCE_SEE_ALL, PROFILE_MEDIUM_GLANCE_TITLE } from "@yunicity/utils";

type ProfileMediumGlanceSectionProps = {
  levelView: PassportLevelView | null;
  activeTribe: ProfileDesktopTribeRailItem | null;
  nextOuting: ProfileDesktopGlanceOuting | null;
  city: string;
  onSeeAll?: () => void;
};

/** Coup d’œil — 3 cartes + en-tête maquette medium. */
export function ProfileMediumGlanceSection({
  levelView,
  activeTribe,
  nextOuting,
  city,
  onSeeAll,
}: ProfileMediumGlanceSectionProps) {
  return (
    <section className="space-y-3" data-profile-medium-glance="">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{PROFILE_MEDIUM_GLANCE_TITLE}</h2>
        {onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="shrink-0 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_MEDIUM_GLANCE_SEE_ALL} →
          </button>
        ) : null}
      </div>
      <ProfileDesktopGlance
        levelView={levelView}
        activeTribe={activeTribe}
        nextOuting={nextOuting}
        city={city}
      />
    </section>
  );
}
