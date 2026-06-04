"use client";

import { maskStaffQrToken } from "@yunicity/utils";
import { useState } from "react";

interface PassportDetailQrCardProps {
  qrToken: string;
}

export function PassportDetailQrCard({ qrToken }: PassportDetailQrCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopyFeedback("Token copié.");
      window.setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setCopyFeedback("Copie impossible sur cet appareil.");
      window.setTimeout(() => setCopyFeedback(null), 3000);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-950">
        QR staff
      </h2>
      <p className="mt-2 text-sm text-amber-900/90">
        Token visible uniquement staff. Ne pas partager hors investigation modération.
      </p>
      <p className="mt-4 break-all rounded-lg border border-amber-200/80 bg-white px-3 py-2 font-mono text-xs text-stone-800">
        {maskStaffQrToken(qrToken, revealed)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRevealed((value) => !value)}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-50"
        >
          {revealed ? "Masquer" : "Afficher"}
        </button>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-50"
        >
          Copier
        </button>
      </div>
      {copyFeedback ? (
        <p className="mt-2 text-xs text-amber-900" role="status">
          {copyFeedback}
        </p>
      ) : null}
    </section>
  );
}
