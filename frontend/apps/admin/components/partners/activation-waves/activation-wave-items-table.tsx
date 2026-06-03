"use client";

import { ActivationWaveItemChecklist } from "@/components/partners/activation-waves/activation-wave-item-checklist";
import { ActivationWaveItemNotes } from "@/components/partners/activation-waves/activation-wave-item-notes";
import type {
  ActivationWaveItemStatus,
  AdminActivationWaveItem,
  AdminActivationWaveUpdatePayload,
} from "@yunicity/types";
import {
  ACTIVATION_WAVE_ITEM_STATUS_OPTIONS,
  activationWaveItemStatusLabel,
  adminPartnerDetailPath,
  checklistCompletionPercentage,
  isWaveReadyCandidate,
  type ActivationWaveChecklistKey,
} from "@yunicity/utils";
import Link from "next/link";

interface ActivationWaveItemsTableProps {
  items: AdminActivationWaveItem[];
  isPatching: boolean;
  patchingItemId: string | null;
  onPatchItem: (itemId: string, payload: AdminActivationWaveUpdatePayload) => void;
}

export function ActivationWaveItemsTable({
  items,
  isPatching,
  patchingItemId,
  onPatchItem,
}: ActivationWaveItemsTableProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-600">
        Aucun partenaire dans cette vague.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200">
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-3 py-2.5">Partenaire</th>
            <th className="px-3 py-2.5">Statut item</th>
            <th className="px-3 py-2.5">Checklist</th>
            <th className="px-3 py-2.5">Notes</th>
            <th className="px-3 py-2.5">Fiche 360°</th>
            <th className="px-3 py-2.5">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 bg-white">
          {items.map((item) => {
            const rowBusy = isPatching && patchingItemId === item.id;
            const rowDisabled = isPatching;
            const readyCandidate = isWaveReadyCandidate(item);

            return (
              <tr
                key={item.id}
                className={readyCandidate ? "bg-emerald-50/40" : undefined}
              >
                <td className="px-3 py-3 align-top">
                  <p className="font-medium text-stone-900">{item.partner_name_snapshot}</p>
                  {item.partner_slug_snapshot ? (
                    <p className="mt-0.5 font-mono text-xs text-stone-500">
                      {item.partner_slug_snapshot}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-stone-500">
                    Checklist {checklistCompletionPercentage(item.checklist)}%
                  </p>
                </td>
                <td className="px-3 py-3 align-top">
                  <select
                    value={item.status}
                    disabled={rowDisabled}
                    onChange={(event) => {
                      onPatchItem(item.id, {
                        status: event.target.value as ActivationWaveItemStatus,
                      });
                    }}
                    className="w-full min-w-[7rem] rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:opacity-50"
                    aria-label={`Statut pour ${item.partner_name_snapshot}`}
                  >
                    {ACTIVATION_WAVE_ITEM_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {readyCandidate ? (
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      Prêt à passer en « Prêt »
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-3 align-top">
                  <ActivationWaveItemChecklist
                    item={item}
                    disabled={rowDisabled}
                    onToggle={(key: ActivationWaveChecklistKey, nextChecklist) => {
                      onPatchItem(item.id, { checklist: nextChecklist });
                    }}
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  <ActivationWaveItemNotes
                    notes={item.notes}
                    disabled={rowDisabled}
                    onSave={(nextNotes) => {
                      onPatchItem(item.id, { notes: nextNotes });
                    }}
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  {item.organization_id ? (
                    <Link
                      href={adminPartnerDetailPath(item.organization_id)}
                      className="text-xs font-medium text-stone-800 underline-offset-2 hover:underline"
                    >
                      Ouvrir la fiche
                    </Link>
                  ) : (
                    <span className="text-xs text-stone-400">Organisation absente</span>
                  )}
                </td>
                <td className="px-3 py-3 align-top text-xs text-stone-500">
                  {rowBusy ? (
                    <span className="font-medium text-stone-700">Enregistrement…</span>
                  ) : (
                    <span>{activationWaveItemStatusLabel(item.status)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
