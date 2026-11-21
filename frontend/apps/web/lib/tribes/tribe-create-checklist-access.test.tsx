// @vitest-environment jsdom

/**
 * TRIBE-CREATE-CHECKLIST-ACCESS-01 — rendu de la checklist « Avant de publier »
 * (desktop / medium) et du compteur mobile : chaque coche suit sa règle réelle
 * (`TRIBE_CREATE_CHECKLIST_RULES`), le statut compte les éléments obligatoires non
 * cochés. « Accès et adhésion » n'est plus coché en dur. Libellés inchangés.
 */

import {
  TRIBE_CATEGORY_LABELS,
  TRIBE_CREATE_DESKTOP_CHECKLIST_ACCESS,
  TRIBE_CREATE_DESKTOP_CHECKLIST_CHARTER,
  TRIBE_CREATE_DESKTOP_CHECKLIST_IDENTITY,
  TRIBE_CREATE_DESKTOP_CHECKLIST_VISUALS,
  TRIBE_CREATE_MOBILE_CHECKLIST_PROGRESS,
  createEmptyTribeCreateDraft,
  type TribeCreateDraft,
} from "@yunicity/utils";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TribeCreateDesktopChecklist } from "@/components/tribes/create/desktop/tribe-create-desktop-checklist";
import { TribeCreateMobilePreview } from "@/components/tribes/create/mobile/tribe-create-mobile-preview";

afterEach(cleanup);

const categorie = Object.keys(TRIBE_CATEGORY_LABELS)[0] ?? "";
const identite = { name: "Photo Reims", category: categorie, description: "Balades photo dans Reims." };

/** Brouillon relu depuis `sessionStorage` (même chemin que `readStoredDraft`). */
function restaure(champs: Record<string, unknown>): TribeCreateDraft {
  const lu = JSON.parse(JSON.stringify(champs)) as Partial<TribeCreateDraft>;
  return { ...createEmptyTribeCreateDraft(), ...lu };
}

type Coches = { identity: boolean; access: boolean; charter: boolean; visuals: boolean };

const cas: ReadonlyArray<{ nom: string; draft: TribeCreateDraft; coches: Coches; statut: string; progression: number }> = [
  {
    nom: "brouillon vide",
    draft: restaure({}),
    coches: { identity: false, access: true, charter: false, visuals: false },
    statut: "2 erreurs bloquantes",
    progression: 1,
  },
  {
    nom: "identité seule valide",
    draft: restaure(identite),
    coches: { identity: true, access: true, charter: false, visuals: false },
    statut: "1 erreur bloquante",
    progression: 2,
  },
  {
    nom: "charte seule acceptée",
    draft: restaure({ charterAccepted: true }),
    coches: { identity: false, access: true, charter: true, visuals: false },
    statut: "1 erreur bloquante",
    progression: 2,
  },
  {
    nom: "formulaire complet",
    draft: restaure({ ...identite, charterAccepted: true, coverImageUrl: "https://example.com/cover.jpg" }),
    coches: { identity: true, access: true, charter: true, visuals: true },
    statut: "0 erreur bloquante",
    progression: 5,
  },
  {
    nom: "formulaire complet, visibilité invalide",
    draft: restaure({ ...identite, charterAccepted: true, coverImageUrl: "https://example.com/cover.jpg", visibility: "private" }),
    coches: { identity: true, access: false, charter: true, visuals: true },
    statut: "1 erreur bloquante",
    progression: 3,
  },
];

const LIBELLES: Record<keyof Coches, string> = {
  identity: TRIBE_CREATE_DESKTOP_CHECKLIST_IDENTITY,
  access: TRIBE_CREATE_DESKTOP_CHECKLIST_ACCESS,
  charter: TRIBE_CREATE_DESKTOP_CHECKLIST_CHARTER,
  visuals: TRIBE_CREATE_DESKTOP_CHECKLIST_VISUALS,
};

describe("checklist desktop / medium (TRIBE-CREATE-CHECKLIST-ACCESS-01)", () => {
  it.each(cas)("$nom", ({ draft, coches, statut }) => {
    const { container } = render(<TribeCreateDesktopChecklist draft={draft} />);
    for (const [cle, attendu] of Object.entries(coches)) {
      const item = container.querySelector<HTMLElement>(`[data-tribe-create-checklist-item="${cle}"]`);
      expect(item, `élément ${cle} introuvable`).not.toBeNull();
      expect(item?.dataset.done, `coche ${cle}`).toBe(String(attendu));
      // Libellé visible, suivi du seul état masqué (TRIBE-CREATE-CHECKLIST-A11Y-01).
      expect(item?.textContent).toBe(`${LIBELLES[cle as keyof Coches]}${item?.querySelector(".sr-only")?.textContent ?? ""}`);
    }
    expect(container.querySelector("[data-tribe-create-blocking-status]")?.textContent).toBe(statut);
  });
});

describe("compteur mobile (TRIBE-CREATE-CHECKLIST-ACCESS-01)", () => {
  it.each(cas)("$nom", ({ draft, progression }) => {
    const { container } = render(<TribeCreateMobilePreview draft={draft} />);
    expect(container.textContent).toContain(TRIBE_CREATE_MOBILE_CHECKLIST_PROGRESS(progression, 5));
  });
});
