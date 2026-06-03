"use client";

import type { AdminActivationWaveChecklist, AdminActivationWaveItem } from "@yunicity/types";
import {
  ACTIVATION_WAVE_CHECKLIST_KEYS,
  activationWaveChecklistLabel,
  mergeChecklistKey,
  type ActivationWaveChecklistKey,
} from "@yunicity/utils";

interface ActivationWaveItemChecklistProps {
  item: AdminActivationWaveItem;
  disabled: boolean;
  onToggle: (key: ActivationWaveChecklistKey, nextChecklist: AdminActivationWaveChecklist) => void;
}

export function ActivationWaveItemChecklist({
  item,
  disabled,
  onToggle,
}: ActivationWaveItemChecklistProps) {
  return (
    <ul className="space-y-1.5">
      {ACTIVATION_WAVE_CHECKLIST_KEYS.map((key) => (
        <li key={key}>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-700">
            <input
              type="checkbox"
              className="size-3.5 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
              checked={item.checklist[key]}
              disabled={disabled}
              onChange={(event) => {
                onToggle(key, mergeChecklistKey(item.checklist, key, event.target.checked));
              }}
            />
            <span>{activationWaveChecklistLabel(key)}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
