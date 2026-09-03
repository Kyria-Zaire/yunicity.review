import { describe, expect, it } from "vitest";

import {
  HELP_CENTER_COPY,
  HELP_CENTER_FAQ_ITEMS,
  HELP_CENTER_ROUTES,
  filterHelpCenterContent,
} from "./help-center-contract";

describe("help-center-contract", () => {
  it("fixe le copy hero et les CTA", () => {
    expect(HELP_CENTER_COPY.heroTitle).toBe("Comment pouvons-nous vous aider ?");
    expect(HELP_CENTER_COPY.searchPlaceholder).toBe("Rechercher dans l'aide");
    expect(HELP_CENTER_COPY.contactCta).toBe("Nous contacter");
  });

  it("pointe vers des routes publiques existantes", () => {
    expect(HELP_CENTER_ROUTES.contact).toBe("mailto:contact@yunicity.city");
    expect(HELP_CENTER_ROUTES.neighborhoods).toBe("/neighborhoods");
    expect(HELP_CENTER_ROUTES.tribes).toBe("/tribes");
    expect(HELP_CENTER_ROUTES.passport).toBe("/passport");
  });

  it("filtre catégories et FAQ par recherche", () => {
    const { categories, faqItems } = filterHelpCenterContent("passport");
    expect(categories.some((item) => item.id === "passport")).toBe(true);
    expect(faqItems.some((item) => item.id === "passport")).toBe(true);
    expect(HELP_CENTER_FAQ_ITEMS).toHaveLength(5);
  });
});
