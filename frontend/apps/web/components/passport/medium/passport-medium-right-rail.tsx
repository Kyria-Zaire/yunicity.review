"use client";

import {
  PassportActivityPanel,
  PassportQrPanel,
  PassportSavedPanel,
} from "@/components/passport/passport-rail-panels";
import type { PartnerOfferPublic } from "@yunicity/types";
import type { PassportDesktopActivityItem } from "@yunicity/utils";

type PassportMediumRightRailProps = {
  displayName: string;
  city: string;
  qrPayload: string | null;
  qrLoading: boolean;
  savedOffers: PartnerOfferPublic[];
  activityItems: PassportDesktopActivityItem[];
  onOpenHistory: () => void;
};

/**
 * Contenu « rail droit » medium — 640 → 1023 px (DESKTOP-PASSPORT-01).
 * QR seul en pleine largeur : « Prochaine étape » est masqué (PASSPORT-LEVEL-SCALE-01,
 * D2) ; puis saved + activité en grille 2 colonnes.
 */
export function PassportMediumSummaryRow({
  displayName,
  city,
  qrPayload,
  qrLoading,
}: Pick<PassportMediumRightRailProps, "displayName" | "city" | "qrPayload" | "qrLoading">) {
  return (
    <div
      className="passport-medium-summary-row"
      data-passport-medium-right-rail=""
      aria-label="QR Passport"
    >
      <PassportQrPanel
        displayName={displayName}
        city={city}
        qrPayload={qrPayload}
        qrLoading={qrLoading}
        variant="medium"
      />
      {/* PASSPORT-LEVEL-SCALE-01 (D2) : « Prochaine étape » masqué, voir le rail desktop. */}
    </div>
  );
}

export function PassportMediumDualPanel({
  savedOffers,
  activityItems,
  onOpenHistory,
}: Pick<PassportMediumRightRailProps, "savedOffers" | "activityItems" | "onOpenHistory">) {
  return (
    <div
      className="passport-medium-dual-panel passport-medium-grid-2"
      data-passport-medium-dual-panel=""
      aria-label="Offres enregistrées et activité"
    >
      <PassportSavedPanel savedOffers={savedOffers} variant="medium" />
      <PassportActivityPanel
        activityItems={activityItems}
        onOpenHistory={onOpenHistory}
        variant="medium"
      />
    </div>
  );
}
