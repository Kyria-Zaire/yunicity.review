import { describe, expect, it } from "vitest";

import type { AdminActivationWaveItem } from "@yunicity/types";

import {
  ACTIVATION_WAVE_CHECKLIST_LABELS,
  ACTIVATION_WAVE_ITEM_STATUS_LABELS,
  ACTIVATION_WAVE_STATUS_LABELS,
  activationWaveChecklistLabel,
  activationWaveItemStatusLabel,
  activationWaveStatusLabel,
  checklistCompletionCount,
  checklistCompletionPercentage,
  defaultActivationChecklist,
  isWaveReadyCandidate,
  mergeChecklistKey,
  normalizeActivationWaveItemPatchPayload,
  waveActivationProgressPercent,
} from "./admin-activation-wave";

function sampleItem(
  overrides: Partial<AdminActivationWaveItem> = {},
): AdminActivationWaveItem {
  return {
    id: "item-1",
    organization_id: "org-1",
    partner_profile_id: null,
    partner_name_snapshot: "Café Test",
    partner_slug_snapshot: "cafe-test",
    status: "candidate",
    checklist: defaultActivationChecklist(),
    notes: null,
    ...overrides,
  };
}

describe("admin-activation-wave helpers", () => {
  it("labels wave, item and checklist keys", () => {
    expect(ACTIVATION_WAVE_STATUS_LABELS.active).toBe("Active");
    expect(activationWaveStatusLabel("draft")).toBe("Brouillon");
    expect(ACTIVATION_WAVE_ITEM_STATUS_LABELS.ready).toBe("Prêt");
    expect(activationWaveItemStatusLabel("later")).toBe("Plus tard");
    expect(ACTIVATION_WAVE_CHECKLIST_LABELS.qr_ready).toContain("QR");
    expect(activationWaveChecklistLabel("go_public_ready")).toContain("public");
  });

  it("counts checklist completion", () => {
    const empty = defaultActivationChecklist();
    expect(checklistCompletionCount(empty)).toBe(0);
    expect(checklistCompletionPercentage(empty)).toBe(0);

    const partial = mergeChecklistKey(empty, "contact_confirmed", true);
    expect(checklistCompletionCount(partial)).toBe(1);
    expect(checklistCompletionPercentage(partial)).toBe(20);

    const full = {
      contact_confirmed: true,
      assets_received: true,
      passport_offer_ready: true,
      qr_ready: true,
      go_public_ready: true,
    };
    expect(checklistCompletionCount(full)).toBe(5);
    expect(checklistCompletionPercentage(full)).toBe(100);
  });

  it("detects ready candidate", () => {
    expect(isWaveReadyCandidate(sampleItem())).toBe(false);
    expect(
      isWaveReadyCandidate(
        sampleItem({
          checklist: {
            contact_confirmed: true,
            assets_received: true,
            passport_offer_ready: true,
            qr_ready: true,
            go_public_ready: true,
          },
        }),
      ),
    ).toBe(true);
    expect(
      isWaveReadyCandidate(
        sampleItem({
          status: "ready",
          checklist: {
            contact_confirmed: true,
            assets_received: true,
            passport_offer_ready: true,
            qr_ready: true,
            go_public_ready: true,
          },
        }),
      ),
    ).toBe(false);
  });

  it("computes wave progress", () => {
    expect(
      waveActivationProgressPercent({
        id: "w1",
        city: "Reims",
        code: "wave_1",
        name: "Wave 1",
        status: "active",
        items_total: 10,
        items_ready: 3,
        items_activated: 4,
      }),
    ).toBe(40);
    expect(
      waveActivationProgressPercent({
        id: "w2",
        city: "Reims",
        code: "wave_2",
        name: "Wave 2",
        status: "draft",
        items_total: 0,
        items_ready: 0,
        items_activated: 0,
      }),
    ).toBe(0);
  });

  it("normalizes patch payload", () => {
    expect(
      normalizeActivationWaveItemPatchPayload({
        status: "ready",
        notes: "  note terrain  ",
      }),
    ).toEqual({
      status: "ready",
      notes: "note terrain",
    });
    expect(
      normalizeActivationWaveItemPatchPayload({
        notes: "   ",
      }),
    ).toEqual({ notes: null });
  });
});
