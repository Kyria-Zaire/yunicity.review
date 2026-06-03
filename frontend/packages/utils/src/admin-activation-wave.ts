/** Admin activation waves UI helpers (ADMIN-02C-D). */

import type {
  ActivationWaveItemStatus,
  ActivationWaveStatus,
  AdminActivationWaveChecklist,
  AdminActivationWaveItem,
  AdminActivationWaveListItem,
  AdminActivationWaveUpdatePayload,
} from "@yunicity/types";

export const ACTIVATION_WAVE_CHECKLIST_KEYS = [
  "contact_confirmed",
  "assets_received",
  "passport_offer_ready",
  "qr_ready",
  "go_public_ready",
] as const satisfies readonly (keyof AdminActivationWaveChecklist)[];

export type ActivationWaveChecklistKey = (typeof ACTIVATION_WAVE_CHECKLIST_KEYS)[number];

export const ACTIVATION_WAVE_STATUS_LABELS: Record<ActivationWaveStatus, string> = {
  draft: "Brouillon",
  active: "Active",
  completed: "Terminée",
  archived: "Archivée",
};

export const ACTIVATION_WAVE_ITEM_STATUS_LABELS: Record<ActivationWaveItemStatus, string> = {
  candidate: "Candidat",
  ready: "Prêt",
  activated: "Activé",
  later: "Plus tard",
  abandoned: "Abandonné",
};

export const ACTIVATION_WAVE_CHECKLIST_LABELS: Record<ActivationWaveChecklistKey, string> = {
  contact_confirmed: "Contact confirmé",
  assets_received: "Assets reçus",
  passport_offer_ready: "Offre passport prête",
  qr_ready: "QR prêt",
  go_public_ready: "Go public prêt",
};

export const ACTIVATION_WAVE_ITEM_STATUS_OPTIONS: {
  value: ActivationWaveItemStatus;
  label: string;
}[] = (
  ["candidate", "ready", "activated", "later", "abandoned"] as ActivationWaveItemStatus[]
).map((value) => ({
  value,
  label: ACTIVATION_WAVE_ITEM_STATUS_LABELS[value],
}));

export function activationWaveStatusLabel(status: ActivationWaveStatus): string {
  return ACTIVATION_WAVE_STATUS_LABELS[status] ?? status;
}

export function activationWaveItemStatusLabel(status: ActivationWaveItemStatus): string {
  return ACTIVATION_WAVE_ITEM_STATUS_LABELS[status] ?? status;
}

export function activationWaveChecklistLabel(key: ActivationWaveChecklistKey): string {
  return ACTIVATION_WAVE_CHECKLIST_LABELS[key];
}

export function defaultActivationChecklist(): AdminActivationWaveChecklist {
  return {
    contact_confirmed: false,
    assets_received: false,
    passport_offer_ready: false,
    qr_ready: false,
    go_public_ready: false,
  };
}

export function checklistCompletionCount(checklist: AdminActivationWaveChecklist): number {
  return ACTIVATION_WAVE_CHECKLIST_KEYS.filter((key) => checklist[key]).length;
}

export function checklistCompletionPercentage(checklist: AdminActivationWaveChecklist): number {
  const total = ACTIVATION_WAVE_CHECKLIST_KEYS.length;
  return Math.round((checklistCompletionCount(checklist) / total) * 100);
}

/** Candidat prêt à passer en statut « ready » (checklist complète, encore candidat). */
export function isWaveReadyCandidate(item: AdminActivationWaveItem): boolean {
  return (
    item.status === "candidate" &&
    checklistCompletionCount(item.checklist) === ACTIVATION_WAVE_CHECKLIST_KEYS.length
  );
}

export function waveActivationProgressPercent(wave: AdminActivationWaveListItem): number {
  if (wave.items_total <= 0) {
    return 0;
  }
  return Math.round((wave.items_activated / wave.items_total) * 100);
}

export function normalizeActivationWaveItemPatchPayload(
  payload: AdminActivationWaveUpdatePayload,
): AdminActivationWaveUpdatePayload {
  const normalized: AdminActivationWaveUpdatePayload = {};
  if (payload.status !== undefined) {
    normalized.status = payload.status;
  }
  if (payload.checklist !== undefined) {
    normalized.checklist = { ...payload.checklist };
  }
  if (payload.notes !== undefined) {
    const trimmed = payload.notes?.trim() ?? "";
    normalized.notes = trimmed.length > 0 ? trimmed : null;
  }
  return normalized;
}

export function mergeChecklistKey(
  checklist: AdminActivationWaveChecklist,
  key: ActivationWaveChecklistKey,
  checked: boolean,
): AdminActivationWaveChecklist {
  return { ...checklist, [key]: checked };
}
