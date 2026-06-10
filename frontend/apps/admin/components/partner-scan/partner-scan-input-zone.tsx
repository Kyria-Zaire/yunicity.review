"use client";

import { PARTNER_SCAN_CAMERA_NOTICE } from "@yunicity/utils";
import { CameraOff, RotateCcw, Search } from "lucide-react";
import type { Ref } from "react";

interface PartnerScanInputZoneProps {
  inputRef: Ref<HTMLInputElement>;
  code: string;
  isBusy: boolean;
  disabled?: boolean;
  onCodeChange: (value: string) => void;
  onResolve: () => void;
  onReset: () => void;
}

export function PartnerScanInputZone({
  inputRef,
  code,
  isBusy,
  disabled = false,
  onCodeChange,
  onResolve,
  onReset,
}: PartnerScanInputZoneProps) {
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onResolve();
  }

  return (
    <section
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="partner-scan-input-title"
    >
      <div>
        <h2 id="partner-scan-input-title" className="text-lg font-semibold text-stone-950">
          Scan ou saisie manuelle
        </h2>
        <p className="mt-1 flex items-start gap-2 text-sm text-stone-600">
          <CameraOff className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
          {PARTNER_SCAN_CAMERA_NOTICE}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1.5" htmlFor="partner-scan-code">
          <span className="text-sm font-medium text-stone-800">
            QR, numéro Passport ou code
          </span>
          <input
            ref={inputRef}
            id="partner-scan-code"
            type="text"
            value={code}
            disabled={disabled || isBusy}
            onChange={(event) => onCodeChange(event.target.value)}
            placeholder="YNCP1:… ou numéro Passport"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full rounded-xl border border-stone-300 px-4 py-3.5 text-base text-stone-900 shadow-sm focus:border-yunicity-primary focus:outline-none focus:ring-2 focus:ring-yunicity-primary/25"
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={disabled || isBusy || !code.trim()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            <Search className="h-5 w-5" aria-hidden />
            {isBusy ? "Recherche…" : "Rechercher"}
          </button>
          <button
            type="button"
            disabled={disabled || isBusy}
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3.5 text-base font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-60"
          >
            <RotateCcw className="h-5 w-5" aria-hidden />
            Réinitialiser
          </button>
        </div>
      </form>
    </section>
  );
}
