"use client";

import type { AdminPartnerCapabilities } from "@yunicity/types";
import {
  capabilityLabel,
  type AdminPartnerCapabilityKey,
} from "@yunicity/utils";

const CAPABILITY_KEYS: AdminPartnerCapabilityKey[] = [
  "can_create_profile",
  "can_activate",
  "can_pause",
  "can_upgrade_premium",
  "can_update_settings",
];

interface PartnerDetailCapabilitiesProps {
  capabilities: AdminPartnerCapabilities;
}

export function PartnerDetailCapabilities({ capabilities }: PartnerDetailCapabilitiesProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Capacités (informatif)
      </h2>
      <p className="mt-2 text-sm text-stone-600">
        Miroir des capacités renvoyées par l&apos;API — les boutons ci-dessus ne s&apos;affichent
        que si la valeur est <strong>Oui</strong>.
      </p>
      <ul className="mt-4 space-y-2">
        {CAPABILITY_KEYS.map((key) => {
          const enabled = capabilities[key];
          return (
            <li
              key={key}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                enabled
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                  : "border-stone-200 bg-white text-stone-500"
              }`}
            >
              <span>{capabilityLabel(key)}</span>
              <span className="text-xs font-medium">{enabled ? "Oui" : "Non"}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
