// @vitest-environment jsdom

/**
 * TRIBE-CREATE-PREVIEW-VISIBILITY-01 — badge de visibilité des aperçus de création de tribu.
 * `public` → « Tribu publique », `private_invite` → « Tribu privée » (rendus inchangés) ;
 * valeur invalide (brouillon relu depuis `sessionStorage`) → AUCUN badge. Avant ce lot, toute
 * valeur autre que `public` affichait « Tribu privée ». Trois aperçus (desktop, medium, mobile),
 * modes « Carte » et « Détail » pour desktop et medium.
 */

import {
  TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PRIVATE,
  TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PUBLIC,
  TRIBE_CREATE_DESKTOP_PREVIEW_MODE_DETAIL,
  createEmptyTribeCreateDraft,
  type TribeCreateDraft,
} from "@yunicity/utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { TribeCreateDesktopPreview } from "@/components/tribes/create/desktop/tribe-create-desktop-preview";
import { TribeCreateMediumBottomRail } from "@/components/tribes/create/medium/tribe-create-medium-bottom-rail";
import { TribeCreateMobilePreview } from "@/components/tribes/create/mobile/tribe-create-mobile-preview";

afterEach(cleanup);

/** Brouillon relu depuis `sessionStorage` (même chemin que `readStoredDraft`). */
function restaure(visibility: unknown): TribeCreateDraft {
  const lu = JSON.parse(JSON.stringify({ name: "Photo Reims", visibility })) as Partial<TribeCreateDraft>;
  return { ...createEmptyTribeCreateDraft(), ...lu };
}

const BADGE_CLASSES = "inline-flex rounded-full bg-sky-100 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800";
const BADGES = [TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PUBLIC, TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PRIVATE];

function badgesAffiches(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>("p")].filter((p) => BADGES.includes(p.textContent ?? ""));
}

const APERCUS: ReadonlyArray<{ nom: string; rendre: (draft: TribeCreateDraft) => ReactElement; detail: boolean }> = [
  { nom: "desktop", rendre: (draft) => <TribeCreateDesktopPreview draft={draft} />, detail: true },
  { nom: "medium", rendre: (draft) => <TribeCreateMediumBottomRail draft={draft} />, detail: true },
  { nom: "mobile", rendre: (draft) => <TribeCreateMobilePreview draft={draft} />, detail: false },
];

const MODES = ["carte", "détail"] as const;

describe.each(APERCUS)("aperçu $nom", ({ rendre, detail }) => {
  const modes = detail ? MODES : (["carte"] as const);

  describe.each(modes)("mode %s", (mode) => {
    function afficher(draft: TribeCreateDraft) {
      const vue = render(rendre(draft));
      if (mode === "détail") fireEvent.click(screen.getByRole("button", { name: TRIBE_CREATE_DESKTOP_PREVIEW_MODE_DETAIL }));
      return vue;
    }

    it("public → « Tribu publique », rendu inchangé", () => {
      const { container } = afficher(restaure("public"));
      const badges = badgesAffiches(container);
      expect(badges.map((b) => b.textContent)).toEqual([TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PUBLIC]);
      for (const cls of BADGE_CLASSES.split(" ")) expect(badges[0]?.classList.contains(cls)).toBe(true);
    });

    it("private_invite → « Tribu privée », rendu inchangé", () => {
      const { container } = afficher(restaure("private_invite"));
      const badges = badgesAffiches(container);
      expect(badges.map((b) => b.textContent)).toEqual([TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PRIVATE]);
      for (const cls of BADGE_CLASSES.split(" ")) expect(badges[0]?.classList.contains(cls)).toBe(true);
    });

    it.each(["private", "", null, 1])("valeur invalide %j → aucun badge, le reste de l'aperçu reste affiché", (valeur) => {
      const { container } = afficher(restaure(valeur));
      expect(badgesAffiches(container)).toEqual([]);
      expect(container.querySelector(".bg-sky-100")).toBeNull();
      expect(screen.getAllByRole("heading", { name: "Photo Reims" }).length).toBeGreaterThan(0);
    });
  });
});
