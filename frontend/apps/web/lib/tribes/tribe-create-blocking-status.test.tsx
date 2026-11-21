// @vitest-environment jsdom

/**
 * TRIBE-CREATE-BLOCKING-STATUS-01 — le statut de la checklist de création de
 * tribu affichait une coche verte même avec des erreurs bloquantes.
 * Sans erreur : coche verte. Avec erreurs : alerte rouge explicite.
 * Le comptage reste `tribeCreateBlockingErrorCount` (règles inchangées).
 */

import { TRIBE_CATEGORY_LABELS, createEmptyTribeCreateDraft, type TribeCreateDraft } from "@yunicity/utils";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TribeCreateDesktopChecklist } from "@/components/tribes/create/desktop/tribe-create-desktop-checklist";
import { TribeCreateMobilePreview } from "@/components/tribes/create/mobile/tribe-create-mobile-preview";

afterEach(cleanup);

const categorie = Object.keys(TRIBE_CATEGORY_LABELS)[0] ?? "";

const brouillons: ReadonlyArray<{ nom: string; draft: TribeCreateDraft; etat: "valid" | "errors"; texte: string }> = [
  { nom: "vide — 2 erreurs", draft: createEmptyTribeCreateDraft(), etat: "errors", texte: "2 erreurs bloquantes" },
  {
    nom: "identité valide, charte non acceptée — 1 erreur",
    draft: { ...createEmptyTribeCreateDraft(), name: "Photo Reims", category: categorie, description: "Balades photo dans Reims." },
    etat: "errors",
    texte: "1 erreur bloquante",
  },
  {
    nom: "complet — aucune erreur",
    draft: { ...createEmptyTribeCreateDraft(), name: "Photo Reims", category: categorie, description: "Balades photo dans Reims.", charterAccepted: true },
    etat: "valid",
    texte: "",
  },
];

function statut(container: HTMLElement): HTMLElement {
  const element = container.querySelector<HTMLElement>("[data-tribe-create-blocking-status]");
  expect(element, "statut introuvable").not.toBeNull();
  return element!;
}

describe.each([
  ["desktop / medium", (draft: TribeCreateDraft) => render(<TribeCreateDesktopChecklist draft={draft} />)],
  ["mobile", (draft: TribeCreateDraft) => render(<TribeCreateMobilePreview draft={draft} />)],
] as const)("statut des erreurs bloquantes — %s (TRIBE-CREATE-BLOCKING-STATUS-01)", (_palier, rendre) => {
  it.each(brouillons)("$nom", ({ draft, etat, texte }) => {
    const { container } = rendre(draft);
    const element = statut(container);
    expect(element.dataset.tribeCreateBlockingStatus).toBe(etat);
    if (etat === "errors") {
      expect(element.className).toContain("text-red-700");
      expect(element.className).not.toContain("text-emerald");
      expect(element.textContent).toBe(texte);
    } else {
      expect(element.className).toContain("text-emerald-700");
      expect(element.className).not.toContain("text-red");
    }
    expect(element.querySelector("svg")).not.toBeNull();
  });
});
