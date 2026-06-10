"use client";

import { PartnerScanHelp } from "@/components/partner-scan/partner-scan-help";
import { PartnerScanHero } from "@/components/partner-scan/partner-scan-hero";
import { PartnerScanInputZone } from "@/components/partner-scan/partner-scan-input-zone";
import { PartnerScanKpiStrip } from "@/components/partner-scan/partner-scan-kpi-strip";
import { PartnerScanNextAction } from "@/components/partner-scan/partner-scan-next-action";
import { PartnerScanResultCard } from "@/components/partner-scan/partner-scan-result-card";
import { PartnerScanSignal } from "@/components/partner-scan/partner-scan-signal";
import { PartnerScanSuccessCard } from "@/components/partner-scan/partner-scan-success-card";
import { usePartnerScan } from "@/lib/hooks/use-partner-scan";
import { useEffect, useRef } from "react";

export function PartnerScanWorkspace() {
  const scan = usePartnerScan();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        scan.reset();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scan]);

  function handleNextAction(action: ReturnType<typeof usePartnerScan>["nextAction"]["action"]) {
    switch (action) {
      case "focus-input":
        inputRef.current?.focus();
        break;
      case "confirm-redeem":
        void scan.redeemSelected();
        break;
      case "new-scan":
        scan.reset();
        inputRef.current?.focus();
        break;
      case "retry":
        void scan.retry();
        break;
    }
  }

  const inputDisabled = scan.phase === "redeemed";

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-10">
      <PartnerScanHero />
      <PartnerScanSignal signal={scan.signal} />
      <PartnerScanNextAction
        action={scan.nextAction}
        disabled={scan.isBusy || (scan.nextAction.action === "confirm-redeem" && !scan.canRedeem)}
        onAction={handleNextAction}
      />
      <PartnerScanKpiStrip cards={scan.kpiCards} />

      {scan.error ? (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          role="alert"
        >
          <p>{scan.error}</p>
          {scan.errorCode ? (
            <p className="mt-1 font-mono text-xs text-rose-700/80">Code : {scan.errorCode}</p>
          ) : null}
        </div>
      ) : null}

      {scan.redeemResult ? (
        <PartnerScanSuccessCard result={scan.redeemResult} onNewScan={() => {
          scan.reset();
          inputRef.current?.focus();
        }} />
      ) : null}

      {scan.phase !== "redeemed" ? (
        <PartnerScanInputZone
          inputRef={inputRef}
          code={scan.code}
          isBusy={scan.isResolving}
          disabled={inputDisabled}
          onCodeChange={scan.setCode}
          onResolve={() => void scan.resolveCode()}
          onReset={() => {
            scan.reset();
            inputRef.current?.focus();
          }}
        />
      ) : null}

      {scan.passport && scan.phase === "resolved" ? (
        <PartnerScanResultCard
          passport={scan.passport}
          offers={scan.offers}
          selectedOfferId={scan.selectedOfferId}
          phase={scan.phase}
          isRedeeming={scan.isRedeeming}
          canRedeem={scan.canRedeem}
          onSelectOffer={scan.setSelectedOfferId}
          onRedeem={() => void scan.redeemSelected()}
        />
      ) : null}

      <PartnerScanHelp />
    </div>
  );
}
