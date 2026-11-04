"use client";

import {
  PassportActivityPanel,
  PassportProgressPanel,
  PassportQrPanel,
  PassportRulesPanel,
  PassportSavedPanel,
} from "@/components/passport/passport-rail-panels";
import type { PartnerOfferPublic } from "@yunicity/types";
import type { PassportDesktopActivityItem, PassportDesktopSegmentProgress } from "@yunicity/utils";

type PassportDesktopRightRailProps = {
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

export function PassportDesktopRightRail({
  displayName,
  city,
  qrPayload,
  qrLoading,
  segmentProgress,
  savedOffers,
  activityItems,
  onOpenHistory,
  onOpenProgress,
}: PassportDesktopRightRailProps) {
  return (
    <aside
      className="passport-desktop-right-rail space-y-4"
      aria-label="Résumé Passport"
      data-passport-desktop-right-rail=""
    >
      <PassportQrPanel
        displayName={displayName}
        city={city}
        qrPayload={qrPayload}
        qrLoading={qrLoading}
      />
      <PassportProgressPanel segmentProgress={segmentProgress} onOpenProgress={onOpenProgress} />
      <PassportSavedPanel savedOffers={savedOffers} />
      <PassportActivityPanel activityItems={activityItems} onOpenHistory={onOpenHistory} />
      <PassportRulesPanel />
    </aside>
  );
}
