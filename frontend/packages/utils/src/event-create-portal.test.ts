import { describe, expect, it } from "vitest";

import {
  createEmptyEventCreateDraft,
  eventCreateChecklistProgress,
  eventCreateChecklistState,
  eventCreateStepProgressPercent,
  validateEventCreateStep,
} from "./event-create-portal";

describe("event-create-portal", () => {
  it("validates essentials step", () => {
    const draft = createEmptyEventCreateDraft();
    expect(validateEventCreateStep("essentials", draft).valid).toBe(false);

    const valid = {
      ...draft,
      organizationId: "org-1",
      title: "Visite nocturne",
      categoryId: "culture" as const,
      description: "Une découverte lumineuse du patrimoine rémois.",
    };
    expect(validateEventCreateStep("essentials", valid).valid).toBe(true);
  });

  it("tracks checklist progress", () => {
    const draft = createEmptyEventCreateDraft();
    expect(eventCreateChecklistState(draft).essentials).toBe(false);

    const partial = {
      ...draft,
      organizationId: "org-1",
      title: "Visite nocturne",
      categoryId: "culture" as const,
      description: "Une découverte lumineuse du patrimoine rémois.",
      startsAt: "2026-09-01T20:30",
      locationName: "Parvis Notre-Dame",
      coverImageUrl: "https://example.com/cover.jpg",
    };
    const state = eventCreateChecklistState(partial);
    expect(state.essentials).toBe(true);
    expect(state.schedule).toBe(true);
    expect(state.visual).toBe(true);
    expect(state.practical).toBe(false);
  });

  it("calcule la progression étape et checklist", () => {
    const draft = createEmptyEventCreateDraft();
    expect(eventCreateStepProgressPercent("essentials")).toBe(20);
    expect(eventCreateChecklistProgress(draft).completed).toBe(0);
  });
});
