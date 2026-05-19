"use client";

import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";
import { FLASH_PARTNER_HELPER } from "@yunicity/utils";

type PartnerFlashFieldsProps = {
  isFlash: boolean;
  flashEndsAt: string;
  validUntil: string;
  onIsFlashChange: (value: boolean) => void;
  onFlashEndsAtChange: (value: string) => void;
  disabled?: boolean;
};

export function PartnerFlashFields({
  isFlash,
  flashEndsAt,
  validUntil,
  onIsFlashChange,
  onFlashEndsAtChange,
  disabled,
}: PartnerFlashFieldsProps) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/50 p-4" disabled={disabled}>
      <label className="flex items-start gap-3 text-sm text-stone-800">
        <input
          type="checkbox"
          checked={isFlash}
          onChange={(e) => onIsFlashChange(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          <span className="font-medium">Offre flash</span>
          <span className="mt-1 block text-xs text-stone-600">{FLASH_PARTNER_HELPER}</span>
        </span>
      </label>
      {isFlash ? (
        <label className="block text-sm font-medium text-stone-800">
          Fin de la mise en avant flash
          <input
            type="datetime-local"
            required
            value={flashEndsAt}
            max={validUntil || undefined}
            onChange={(e) => onFlashEndsAtChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          />
          <span className="mt-1 block text-xs font-normal text-stone-500">
            Doit être dans le futur et avant la fin de validité de l&apos;offre, si définie.
          </span>
        </label>
      ) : null}
    </fieldset>
  );
}

export { toDatetimeLocalValue, fromDatetimeLocalValue };
