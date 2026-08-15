import { describe, expect, it } from "vitest";

import { isActionable, type StateAction } from "./state-action";

describe("isActionable — aucun CTA mort", () => {
  it("accepte une action avec handler", () => {
    expect(isActionable({ label: "Réessayer", onClick: () => undefined })).toBe(true);
  });

  it("accepte une action avec destination", () => {
    expect(isActionable({ label: "Créer une tribu", href: "/tribes/new" })).toBe(true);
  });

  it("rejette l'absence d'action", () => {
    expect(isActionable(undefined)).toBe(false);
    expect(isActionable(null)).toBe(false);
  });

  it("rejette un libellé vide même si l'action existe", () => {
    expect(isActionable({ label: "   ", onClick: () => undefined })).toBe(false);
  });

  it("rejette une frontière runtime sans handler ni href", () => {
    // Cas d'un appelant JS non typé : le type interdit ce littéral, la garde runtime le rejette.
    const untyped = { label: "Voir" } as unknown as StateAction;
    expect(isActionable(untyped)).toBe(false);
  });

  it("rejette un href vide", () => {
    const untyped = { label: "Voir", href: "" } as unknown as StateAction;
    expect(isActionable(untyped)).toBe(false);
  });
});
