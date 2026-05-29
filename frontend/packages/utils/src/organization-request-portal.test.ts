import { describe, expect, it } from "vitest";

import { buildOrganizationCreateRequest } from "./organization-api";
import {
  ORGANIZATION_REQUEST_CATEGORY_OPTIONS,
  buildOrganizationRequestDescription,
  createEmptyOrganizationRequestDraft,
  validateOrganizationRequestStep,
} from "./organization-request-portal";

describe("organization-request-portal", () => {
  it("validateOrganizationRequestStep requires core info fields", () => {
    const draft = createEmptyOrganizationRequestDraft();
    expect(validateOrganizationRequestStep("info", draft).valid).toBe(false);

    const valid = {
      ...draft,
      name: "Café des Arts",
      categoryId: "cafe_restaurant",
      address: "12 rue de Vesle",
      shortDescription: "Un café culturel au centre-ville.",
    };
    expect(validateOrganizationRequestStep("info", valid).valid).toBe(true);
  });

  it("buildOrganizationRequestDescription merges quartier and instagram", () => {
    const text = buildOrganizationRequestDescription(
      {
        ...createEmptyOrganizationRequestDraft(),
        shortDescription: "Café chaleureux.",
        longDescription: "Programmation live le week-end.",
        instagram: "@cafedesarts",
      },
      "Centre-ville",
    );
    expect(text).toContain("Café chaleureux.");
    expect(text).toContain("Quartier : Centre-ville");
    expect(text).toContain("Instagram: @cafedesarts");
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
    expect(body.category).toBe("Cafés & Restaurants");
    expect(body.postal_code).toBe("51100");
    expect(body.phone).toBe("03 26 00 00 00");
    expect(body.description).toContain("Café culturel.");
  });
});
