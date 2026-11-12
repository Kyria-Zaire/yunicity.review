// @vitest-environment jsdom

/**
 * TRIBE-CREATE-CHECKLIST-A11Y-01 — restitution accessible de la checklist « Avant de publier ».
 *  - desktop / medium : liste nommée par son titre ; chaque élément restitue son libellé, son
 *    état « complété / à compléter » et, pour une règle facultative, « facultatif » — en texte
 *    masqué visuellement (`sr-only`), d'après `TRIBE_CREATE_CHECKLIST_RULES` ;
 *  - mobile : le compteur, déjà lisible, reçoit le contexte « Avant de publier : » ;
 *  - statut des erreurs : sans annonce automatique (ni `aria-live`, ni `role`).
 * Rendu visuel inchangé : classes et icônes vérifiées ici, pixels comparés en navigateur.
 * Ces tests vérifient le DOM et les rôles ; ils ne disent pas ce qu'annonce un lecteur d'écran.
 */

import {
  TRIBE_CATEGORY_LABELS,
  TRIBE_CREATE_DESKTOP_CHECKLIST_ACCESS,
  TRIBE_CREATE_DESKTOP_CHECKLIST_CHARTER,
  TRIBE_CREATE_DESKTOP_CHECKLIST_IDENTITY,
  TRIBE_CREATE_DESKTOP_CHECKLIST_TITLE,
  TRIBE_CREATE_DESKTOP_CHECKLIST_VISUALS,
  TRIBE_CREATE_MOBILE_CHECKLIST_PROGRESS,
  createEmptyTribeCreateDraft,
  type TribeCreateDraft,
} from "@yunicity/utils";
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TribeCreateDesktopChecklist } from "@/components/tribes/create/desktop/tribe-create-desktop-checklist";
import { TribeCreateMobilePreview } from "@/components/tribes/create/mobile/tribe-create-mobile-preview";

afterEach(cleanup);

const categorie = Object.keys(TRIBE_CATEGORY_LABELS)[0] ?? "";
const identite = { name: "Photo Reims", category: categorie, description: "Balades photo dans Reims." };
const vide = createEmptyTribeCreateDraft();
const completSansBanniere: TribeCreateDraft = { ...vide, ...identite, charterAccepted: true };
const complet: TribeCreateDraft = { ...completSansBanniere, coverImageUrl: "https://example.com/cover.jpg" };

const cas: ReadonlyArray<{ nom: string; draft: TribeCreateDraft; lignes: string[]; progression: number }> = [
  {
    nom: "brouillon vide",
    draft: vide,
    lignes: [
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_IDENTITY} : à compléter`,
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_ACCESS} : complété`,
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_CHARTER} : à compléter`,
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_VISUALS} : à compléter, facultatif`,
    ],
    progression: 1,
  },
  {
    nom: "complet sans bannière",
    draft: completSansBanniere,
    lignes: [
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_IDENTITY} : complété`,
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_ACCESS} : complété`,
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_CHARTER} : complété`,
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_VISUALS} : à compléter, facultatif`,
    ],
    progression: 4,
  },
  {
    nom: "complet",
    draft: complet,
    lignes: [
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_IDENTITY} : complété`,
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_ACCESS} : complété`,
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_CHARTER} : complété`,
      `${TRIBE_CREATE_DESKTOP_CHECKLIST_VISUALS} : complété, facultatif`,
    ],
    progression: 5,
  },
];

describe("checklist desktop / medium — restitution accessible", () => {
  it.each(cas)("$nom : liste nommée, libellé + état (+ facultatif) par élément", ({ draft, lignes }) => {
    const { getByRole } = render(<TribeCreateDesktopChecklist draft={draft} />);
    const liste = getByRole("list", { name: TRIBE_CREATE_DESKTOP_CHECKLIST_TITLE });
    const elements = within(liste).getAllByRole("listitem");
    expect(elements.map((el) => el.textContent)).toEqual(lignes);
  });

  it("l'état et « facultatif » sont masqués visuellement, le libellé reste seul visible", () => {
    const { container } = render(<TribeCreateDesktopChecklist draft={vide} />);
    for (const item of container.querySelectorAll<HTMLElement>("[data-tribe-create-checklist-item]")) {
      const masques = item.querySelectorAll(".sr-only");
      expect(masques).toHaveLength(1);
      expect(masques[0]?.textContent).toMatch(/^ : (complété|à compléter)(, facultatif)?$/);
      const visible = item.textContent?.replace(masques[0]?.textContent ?? "", "");
      expect(visible && visible.length > 0).toBe(true);
    }
  });

  it("rendu visuel inchangé : classes et icônes (caractérisation)", () => {
    const { container } = render(<TribeCreateDesktopChecklist draft={completSansBanniere} />);
    expect(container.querySelector("h2")?.className).toBe("text-sm font-bold text-neutral-900");
    expect(container.querySelector("ul")?.className).toBe("mt-3 space-y-2.5");
    const items = [...container.querySelectorAll<HTMLElement>("[data-tribe-create-checklist-item]")];
    expect(items.map((li) => li.className)).toEqual(Array(4).fill("flex items-start gap-2 text-sm"));
    const labels = items.map((li) => li.querySelector(":scope > span:not(.sr-only)")?.className);
    expect(labels).toEqual([
      "font-medium text-neutral-800",
      "font-medium text-neutral-800",
      "font-medium text-neutral-800",
      "text-neutral-500",
    ]);
    for (const li of items) {
      const svg = li.querySelector(":scope > svg");
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
    }
  });
});

describe("compteur mobile — contexte « Avant de publier : »", () => {
  it.each(cas)("$nom : texte du compteur précédé du contexte masqué", ({ draft, progression }) => {
    const { container } = render(<TribeCreateMobilePreview draft={draft} />);
    const texte = `${TRIBE_CREATE_DESKTOP_CHECKLIST_TITLE} : ${TRIBE_CREATE_MOBILE_CHECKLIST_PROGRESS(progression, 5)}`;
    const compteur = [...container.querySelectorAll("p")].find((p) => p.textContent === texte);
    expect(compteur, `compteur « ${texte} » introuvable`).toBeDefined();
    expect(compteur?.querySelector(".sr-only")?.textContent).toBe(`${TRIBE_CREATE_DESKTOP_CHECKLIST_TITLE} : `);
    expect(compteur?.querySelector(":scope > span[aria-hidden]")).not.toBeNull();
  });
});

describe("statut des erreurs — sans annonce automatique", () => {
  it.each([
    ["desktop / medium", () => render(<TribeCreateDesktopChecklist draft={vide} />)],
    ["mobile", () => render(<TribeCreateMobilePreview draft={vide} />)],
  ] as const)("%s", (_palier, rendre) => {
    const { container } = rendre();
    const statut = container.querySelector("[data-tribe-create-blocking-status]");
    expect(statut).not.toBeNull();
    expect(statut?.hasAttribute("aria-live")).toBe(false);
    expect(statut?.hasAttribute("role")).toBe(false);
    expect(container.querySelector("[aria-live]")).toBeNull();
  });
});
