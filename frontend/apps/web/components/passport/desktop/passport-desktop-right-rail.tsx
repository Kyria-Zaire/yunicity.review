"use client";

import {
  PassportActivityPanel,
  PassportQrPanel,
  PassportRulesPanel,
  PassportSavedPanel,
} from "@/components/passport/passport-rail-panels";
import type { PartnerOfferPublic } from "@yunicity/types";
import type { PassportDesktopActivityItem } from "@yunicity/utils";

type PassportDesktopRightRailProps = {
  displayName: string;
  city: string;
  qrPayload: string | null;
  qrLoading: boolean;
  savedOffers: PartnerOfferPublic[];
  activityItems: PassportDesktopActivityItem[];
  onOpenHistory: () => void;
};

export function PassportDesktopRightRail({
  displayName,
  city,
  qrPayload,
  qrLoading,
  savedOffers,
  activityItems,
  onOpenHistory,
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
      {/* PASSPORT-LEVEL-SCALE-01 (D2) : « Prochaine étape » masqué — sans l'échelle à cinq
          paliers il ne lui restait que son titre et un bouton redondant avec « Vos prochaines
          étapes ». Sa reconstruction relève de PASSPORT-PROGRESS-COPY-01. */}
      <PassportSavedPanel savedOffers={savedOffers} />
      <PassportActivityPanel activityItems={activityItems} onOpenHistory={onOpenHistory} />
      <PassportRulesPanel />
    </aside>
  );
}
