import { describe, expect, it } from "vitest";

import { buildOrganizationCreateRequest } from "./organization-api";
import {
  ORGANIZATION_REQUEST_CATEGORY_OPTIONS,
  buildOrganizationRequestDescription,
  createEmptyOrganizationRequestDraft,
  organizationRequestChecklistProgress,
  organizationRequestStepProgressPercent,
  validateOrganizationRequestDraft,
  validateOrganizationRequestStep,
} from "./organization-request-portal";

describe("organization-request-portal", () => {
  it("validateOrganizationRequestStep requires identity fields", () => {
    const draft = createEmptyOrganizationRequestDraft();
    expect(validateOrganizationRequestStep("identity", draft).valid).toBe(false);

    const identityValid = {
      ...draft,
      name: "Atelier du Boulingrin",
      categoryId: "cultural",
      placeTypeId: "cultural_space",
      shortDescription: "Un espace local dédié aux ateliers créatifs.",
    };
    expect(validateOrganizationRequestStep("identity", identityValid).valid).toBe(true);
    expect(validateOrganizationRequestStep("address", identityValid).valid).toBe(false);
  });

  it("validateOrganizationRequestDraft requires address", () => {
    const draft = {
      ...createEmptyOrganizationRequestDraft(),
      name: "Atelier du Boulingrin",
      categoryId: "cultural",
      shortDescription: "Un espace local dédié aux ateliers créatifs.",
    };
    expect(validateOrganizationRequestDraft(draft).valid).toBe(false);

    const complete = { ...draft, address: "12 rue de Vesle" };
    expect(validateOrganizationRequestDraft(complete).valid).toBe(true);
  });

  it("buildOrganizationRequestDescription merges quartier and instagram", () => {
    const text = buildOrganizationRequestDescription(
      {
        ...createEmptyOrganizationRequestDraft(),
        categoryId: "cultural",
        placeTypeId: "cultural_space",
        shortDescription: "Café chaleureux.",
        longDescription: "Programmation live le week-end.",
        instagram: "@cafedesarts",
      },
      "Centre-ville",
    );
    expect(text).toContain("Café chaleureux.");
    expect(text).toContain("Type : Espace culturel");
    expect(text).toContain("Quartier : Centre-ville");
    expect(text).toContain("Instagram: @cafedesarts");
  });

  it("organizationRequestStepProgressPercent maps step order to percent", () => {
    expect(organizationRequestStepProgressPercent("identity")).toBe(20);
    expect(organizationRequestStepProgressPercent("verification")).toBe(100);
  });

  it("organizationRequestChecklistProgress counts completed checklist flags", () => {
    const empty = organizationRequestChecklistProgress(createEmptyOrganizationRequestDraft());
    expect(empty).toEqual({ completed: 0, total: 5 });

    const partial = organizationRequestChecklistProgress({
      ...createEmptyOrganizationRequestDraft(),
      name: "Atelier du Boulingrin",
      categoryId: "cultural",
      placeTypeId: "cultural_space",
      shortDescription: "Un espace local dédié aux ateliers créatifs.",
      address: "12 rue de Vesle",
    });
    expect(partial.completed).toBeGreaterThanOrEqual(2);
    expect(partial.total).toBe(5);
  });

  it("buildOrganizationCreateRequest maps category and phone to API", () => {
    const category = ORGANIZATION_REQUEST_CATEGORY_OPTIONS[0]!;
    const body = buildOrganizationCreateRequest({
      name: "Le Café des Arts",
      type: category.type,
      city: "Reims",
      category: category.category,
      address: "12 rue de Vesle",
      postal_code: "51100",
      phone: "03 26 00 00 00",
      short_description: "Café culturel.",
    });
    expect(body.category).toBe("Lieux culturels");
    expect(body.postal_code).toBe("51100");
    expect(body.phone).toBe("03 26 00 00 00");
    expect(body.description).toContain("Café culturel.");
  });
});
