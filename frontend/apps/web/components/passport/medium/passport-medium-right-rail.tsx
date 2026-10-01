"use client";

import {
  PassportActivityPanel,
  PassportProgressPanel,
  PassportQrPanel,
  PassportSavedPanel,
} from "@/components/passport/passport-rail-panels";
import type { PartnerOfferPublic } from "@yunicity/types";
import type { PassportDesktopActivityItem, PassportDesktopSegmentProgress } from "@yunicity/utils";

type PassportMediumRightRailProps = {
  displayName: string;
  city: string;
  qrPayload: string | null;
  qrLoading: boolean;
  segmentProgress: PassportDesktopSegmentProgress;
  savedOffers: PartnerOfferPublic[];
  activityItems: PassportDesktopActivityItem[];
  onOpenHistory: () => void;
  onOpenProgress: () => void;
};

/**
 * Contenu « rail droit » medium — 640 → 1023 px (DESKTOP-PASSPORT-01).
 * Grilles 2 colonnes dans le flux principal (QR + progression, puis saved + activité).
 */
export function PassportMediumSummaryRow({
  displayName,
  city,
  qrPayload,
  qrLoading,
  segmentProgress,
  onOpenProgress,
}: Pick<
  PassportMediumRightRailProps,
  "displayName" | "city" | "qrPayload" | "qrLoading" | "segmentProgress" | "onOpenProgress"
>) {
  return (
    <div
      className="passport-medium-summary-row passport-medium-grid-2"
      data-passport-medium-right-rail=""
      aria-label="QR et progression"
    >
      <PassportQrPanel
        displayName={displayName}
        city={city}
        qrPayload={qrPayload}
        qrLoading={qrLoading}
        variant="medium"
      />
      <PassportProgressPanel segmentProgress={segmentProgress} onOpenProgress={onOpenProgress} />
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
      <PassportSavedPanel savedOffers={savedOffers} />
      <PassportActivityPanel activityItems={activityItems} onOpenHistory={onOpenHistory} />
    </div>
  );
}
