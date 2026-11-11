"use client";

import { PassportBookletIcon } from "@/components/passport/passport-booklet-icon";
import {
  PassportOffersConditionsBanner,
  PassportOffersHowPanel,
  PassportOffersSavedList,
} from "@/components/passport/passport-offers-panels";
import type { PartnerOfferPublic } from "@yunicity/types";
import type { PassportLevelView } from "@yunicity/utils";
import {
  PASSPORT_DESKTOP_NAV_PASSPORT,
  PASSPORT_DESKTOP_OFFERS_OPEN_PASSPORT,
  PASSPORT_DESKTOP_OFFERS_PASSPORT_ACTIVE,
} from "@yunicity/utils";
import { Check } from "lucide-react";

type PassportDesktopOffersSidebarProps = {
  displayName: string;
  levelView: PassportLevelView;
  savedOffers: PartnerOfferPublic[];
  onOpenPassport: () => void;
  onViewAllSaved: () => void;
};

export function PassportDesktopOffersSidebar({
  displayName,
  levelView,
  savedOffers,
  onOpenPassport,
  onViewAllSaved,
}: PassportDesktopOffersSidebarProps) {
  const { currentLabel } = levelView;

  return (
    <aside
      className="passport-desktop-right-rail space-y-4"
      aria-label="Offres Passport"
      data-passport-desktop-offers-sidebar=""
    >
      <section className="overflow-hidden rounded-[1.25rem] border border-neutral-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-2 bg-yunicity-primary px-4 py-3 text-white">
          <PassportBookletIcon className="h-4 w-4 text-white" />
          <h2 className="text-sm font-bold">{PASSPORT_DESKTOP_NAV_PASSPORT}</h2>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <p className="text-sm font-bold text-neutral-900">{displayName}</p>
            <p className="text-xs text-neutral-500">{currentLabel}</p>
          </div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {PASSPORT_DESKTOP_OFFERS_PASSPORT_ACTIVE}
          </p>
          <button
            type="button"
            onClick={onOpenPassport}
            className="inline-flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
          >
            {PASSPORT_DESKTOP_OFFERS_OPEN_PASSPORT}
          </button>
        </div>
      </section>

      <PassportOffersSavedList
        savedOffers={savedOffers}
        onViewAllSaved={onViewAllSaved}
        titleId="passport-offers-saved-title-rail"
      />
      <PassportOffersHowPanel titleId="passport-offers-how-title-rail" />
      <PassportOffersConditionsBanner titleId="passport-offers-conditions-title-rail" />
    </aside>
  );
}
