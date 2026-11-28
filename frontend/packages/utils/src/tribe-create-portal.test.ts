import { describe, expect, it } from "vitest";

import {
  TRIBE_CREATE_CATEGORY_OPTIONS,
  TRIBE_CREATE_DESC_MAX,
  TRIBE_CREATE_NAME_MAX,
  buildTribeCreatePayload,
  createEmptyTribeCreateDraft,
  createTribeCreateDraftFromParams,
  nextTribeCreateStep,
  previousTribeCreateStep,
  validateTribeCreateStep,
} from "./tribe-create-portal";
import {
  tribeCreateBlockingErrorCount,
  tribeCreateChecklistState,
  tribeCreateChecklistProgress,
  tribeCreateDesktopNextLabel,
  tribeCreateStepProgressPercent,
} from "./tribe-create-desktop-presenter";

describe("tribe-create-portal", () => {
  it("starts with empty draft defaults", () => {
    const draft = createEmptyTribeCreateDraft("Reims");
    expect(draft.city).toBe("Reims");
    expect(draft.visibility).toBe("public");
    expect(draft.charterAccepted).toBe(false);
  });

  it("validates identity step", () => {
    const draft = createEmptyTribeCreateDraft();
    expect(validateTribeCreateStep("identity", draft).valid).toBe(false);

    const valid = {
      ...draft,
      name: "Créateurs de Reims",
      category: "cafe_culture",
      description: "Un espace pour partager ses projets, demander conseil et créer ensemble.",
      city: "Reims",
    };
    expect(validateTribeCreateStep("identity", valid).valid).toBe(true);
  });

  it("enforces name and description limits in validation", () => {
    const draft = {
      ...createEmptyTribeCreateDraft("Reims"),
      name: "x".repeat(TRIBE_CREATE_NAME_MAX + 1),
      category: "music",
      description: "x".repeat(TRIBE_CREATE_DESC_MAX + 1),
    };
    expect(validateTribeCreateStep("identity", draft).valid).toBe(false);
  });

  it("requires charter on access step", () => {
    const draft = createEmptyTribeCreateDraft();
    expect(validateTribeCreateStep("access", draft).valid).toBe(false);
    expect(
      validateTribeCreateStep("access", { ...draft, charterAccepted: true }).valid,
    ).toBe(true);
  });

  it("navigates steps in order", () => {
    expect(nextTribeCreateStep("identity")).toBe("access");
    expect(nextTribeCreateStep("review")).toBeNull();
    expect(previousTribeCreateStep("visuals")).toBe("access");
    expect(previousTribeCreateStep("identity")).toBeNull();
  });

  it("builds API payload from draft", () => {
    const payload = buildTribeCreatePayload({
      ...createEmptyTribeCreateDraft("Reims"),
      name: "  Running Reims  ",
      category: "sport_local",
      description: "  Sorties running le dimanche.  ",
      visibility: "private_invite",
      coverImageUrl: "  ",
      charterAccepted: true,
    });

    expect(payload).toEqual({
      name: "Running Reims",
      description: "Sorties running le dimanche.",
      city: "Reims",
      category: "sport_local",
      visibility: "private_invite",
      cover_image_url: undefined,
      charter_accepted: true,
    });
  });
});

describe("createTribeCreateDraftFromParams (amorçage CTA tag communauté)", () => {
  const validCategory = TRIBE_CREATE_CATEGORY_OPTIONS[0]?.value ?? "";

  it("pré-sélectionne une catégorie réelle + la ville amorcée", () => {
    expect(validCategory).toBeTruthy();
    const draft = createTribeCreateDraftFromParams({ category: validCategory, city: "Reims" }, "X");
    expect(draft.category).toBe(validCategory);
    expect(draft.city).toBe("Reims");
  });

  it("ignore une catégorie inconnue (l'URL est un input non fiable)", () => {
    const draft = createTribeCreateDraftFromParams(
      { category: "not-a-real-category", city: "Reims" },
      "X",
    );
    expect(draft.category).toBe("");
  });

  it("la ville amorcée l'emporte sur le fallback ; vide/absente → fallback", () => {
    expect(createTribeCreateDraftFromParams({ city: "  Épernay " }, "Reims").city).toBe("Épernay");
    expect(createTribeCreateDraftFromParams({ city: "  " }, "Reims").city).toBe("Reims");
    expect(createTribeCreateDraftFromParams({ city: null }, "Reims").city).toBe("Reims");
  });

  it("sans catégorie → draft par défaut (comme empty)", () => {
    const draft = createTribeCreateDraftFromParams({ city: "Reims" }, "Reims");
    expect(draft.category).toBe("");
    expect(draft.visibility).toBe("public");
    expect(draft.name).toBe("");
  });
});

describe("tribe-create-desktop-presenter", () => {
  it("checklist reflects draft completion", () => {
    const draft = createEmptyTribeCreateDraft("Reims");
    expect(tribeCreateChecklistState(draft).identity).toBe(false);
    expect(tribeCreateChecklistState(draft).charter).toBe(false);

    const complete = {
      ...draft,
      name: "Créateurs de Reims",
      category: "cafe_culture",
      description: "Un espace pour partager ses projets, demander conseil et créer ensemble.",
      charterAccepted: true,
      coverImageUrl: "https://example.com/cover.jpg",
    };
    const state = tribeCreateChecklistState(complete);
    expect(state.identity).toBe(true);
    expect(state.charter).toBe(true);
    expect(state.visuals).toBe(true);
  });

  it("counts blocking errors for incomplete draft", () => {
    expect(tribeCreateBlockingErrorCount(createEmptyTribeCreateDraft())).toBeGreaterThan(0);
  });

  it("returns contextual next labels", () => {
    expect(tribeCreateDesktopNextLabel("identity")).toContain("accès");
    expect(tribeCreateDesktopNextLabel("visuals")).toContain("vérification");
  });

  it("computes mobile step progress percent", () => {
    expect(tribeCreateStepProgressPercent("identity")).toBe(25);
    expect(tribeCreateStepProgressPercent("review")).toBe(100);
  });

  it("computes checklist progress with review milestone", () => {
    const draft = createEmptyTribeCreateDraft("Reims");
    expect(tribeCreateChecklistProgress(draft).total).toBe(5);
    expect(tribeCreateChecklistProgress(draft).completed).toBe(1);
  });
});
