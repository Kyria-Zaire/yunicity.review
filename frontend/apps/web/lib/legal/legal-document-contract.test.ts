import { describe, expect, it } from "vitest";

import {
  LEGAL_DOCUMENTS,
  LEGAL_ROUTES,
  getLegalDocument,
  getLegalSectionIds,
} from "./legal-document-contract";

describe("legal-document-contract", () => {
  it("expose les routes publiques légales", () => {
    expect(LEGAL_ROUTES.privacy).toBe("/legal/confidentialite");
    expect(LEGAL_ROUTES.terms).toBe("/legal/conditions-generales");
    expect(LEGAL_ROUTES.help).toBe("/aide");
  });

  it("structure la confidentialité avec sections uniques et CTA paramètres", () => {
    const privacy = getLegalDocument("privacy");
    const ids = getLegalSectionIds(privacy);
    expect(privacy.sections.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ids).size).toBe(ids.length);
    expect(privacy.settingsHref).toContain("/settings#");
    expect(privacy.relatedDocuments.some((item) => item.href === LEGAL_ROUTES.terms)).toBe(true);
  });

  it("structure les CGU avec sections uniques et lien vers la confidentialité", () => {
    const terms = getLegalDocument("terms");
    const ids = getLegalSectionIds(terms);
    expect(terms.sections.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ids).size).toBe(ids.length);
    expect(terms.relatedDocuments.some((item) => item.href === LEGAL_ROUTES.privacy)).toBe(true);
  });

  it("couvre les deux documents canoniques", () => {
    expect(Object.keys(LEGAL_DOCUMENTS).sort()).toEqual(["privacy", "terms"]);
  });
});
