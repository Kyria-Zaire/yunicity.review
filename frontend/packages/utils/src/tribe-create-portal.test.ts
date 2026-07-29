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

describe("tribe-create-portal", () => {
  it("starts with empty draft defaults", () => {
    const draft = createEmptyTribeCreateDraft("Reims");
    expect(draft.city).toBe("Reims");
    expect(draft.visibility).toBe("public");
    expect(draft.charterAccepted).toBe(false);
  });

  it("validates info step", () => {
    const draft = createEmptyTribeCreateDraft();
    expect(validateTribeCreateStep("info", draft).valid).toBe(false);

    const valid = {
      ...draft,
      name: "Cafés & Lecture",
      category: "cafe_culture",
      description: "Rencontres autour des livres et du café à Reims.",
    };
    expect(validateTribeCreateStep("info", valid).valid).toBe(true);
  });

  it("enforces name and description limits in validation", () => {
    const draft = {
      ...createEmptyTribeCreateDraft(),
      name: "x".repeat(TRIBE_CREATE_NAME_MAX + 1),
      category: "music",
      description: "x".repeat(TRIBE_CREATE_DESC_MAX + 1),
    };
    expect(validateTribeCreateStep("info", draft).valid).toBe(false);
  });

  it("requires charter on rules step", () => {
    const draft = createEmptyTribeCreateDraft();
    expect(validateTribeCreateStep("rules", draft).valid).toBe(false);
    expect(
      validateTribeCreateStep("rules", { ...draft, charterAccepted: true }).valid,
    ).toBe(true);
  });

  it("navigates steps in order", () => {
    expect(nextTribeCreateStep("info")).toBe("personalize");
    expect(nextTribeCreateStep("confirm")).toBeNull();
    expect(previousTribeCreateStep("rules")).toBe("personalize");
    expect(previousTribeCreateStep("info")).toBeNull();
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
