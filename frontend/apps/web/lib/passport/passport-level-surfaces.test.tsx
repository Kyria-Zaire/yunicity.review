// @vitest-environment jsdom

/**
 * PASSPORT-LEVEL-SCALE-01 — surfaces web MONTÉES qui affichent le niveau Passport.
 *
 * Décisions de Kyria (11/11) : le niveau est le tier avec son libellé contractuel,
 * prochain niveau seulement s'il existe (rien au-delà de Gold) ; plus de barre ni de
 * compteur d'étapes (D1), ni « Niveau N » ni XP (D4) ; « Niveau indisponible » quand
 * aucun tier n'est reconnu (D3). Les badges ne servent plus de noms de niveau.
 *
 * jsdom ne calcule aucune mise en page : ces tests portent sur le TEXTE et la
 * STRUCTURE rendus ; les captures des trois formats sont faites en navigateur.
 */
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { PassportDesktopHeroCard } from "@/components/passport/desktop/passport-desktop-hero-card";
import { PassportOffersStatusHero } from "@/components/passport/passport-offers-panels";
import { ProfileDesktopGlance } from "@/components/profile/desktop/profile-desktop-glance";
import { ProfileMediumPassportBanner } from "@/components/profile/medium/profile-medium-passport-banner";
import { ProfileMobileLevelBanner } from "@/components/profile/mobile/profile-mobile-level-banner";
import { buildUnavailablePassportLevel, type PassportLevelView } from "@yunicity/utils";

const CASES: Record<string, PassportLevelView> = {
  basic: { tierCode: "basic", currentLabel: "Citoyen·ne", nextLabel: "Silver" },
  silver: { tierCode: "silver", currentLabel: "Silver", nextLabel: "Gold" },
  gold: { tierCode: "gold", currentLabel: "Gold", nextLabel: null },
  indisponible: buildUnavailablePassportLevel(),
};

/** Ce qui ne doit plus jamais apparaître : échelle à cinq paliers, compteurs, XP. */
const FORBIDDEN =
  /\b(Habitant|Contributeur local|Explorateur|Ambassadeur|Référent local)\b|étapes? sur|\b\d+\s*\/\s*\d+\b|\bXP\b|Niveau\s+\d/;

afterEach(cleanup);

function text(container: HTMLElement): string {
  return container.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

describe("carte héros « Mon Passport » (desktop, medium et mobile web)", () => {
  it.each(Object.entries(CASES))("%s : niveau du tier, aucune jauge ni compteur", (_name, levelView) => {
    const { container } = render(
      <PassportDesktopHeroCard city="Reims" displayName="Repro" levelView={levelView} onOpenHistory={() => {}} />,
    );
    const t = text(container);
    if (levelView.tierCode) {
      expect(t).toContain(`Niveau actuel · ${levelView.currentLabel}`);
    } else {
      // Micro-copie validée par Kyria : pas de « Niveau actuel · Niveau indisponible ».
      expect(t).toContain("Niveau indisponible");
      expect(t).not.toContain("Niveau actuel");
    }
    expect(t).not.toMatch(FORBIDDEN);
    expect(container.querySelectorAll('[role="progressbar"], span.rounded-full.flex-1').length).toBe(0);
    if (levelView.nextLabel) {
      // Libellé et valeur sont deux éléments voisins : on vérifie l'enchaînement exact.
      expect(t).toContain(`Prochain niveau${levelView.nextLabel}`);
    } else {
      expect(t).not.toContain("Prochain niveau");
    }
  });

  it("Gold : aucun niveau supérieur inventé", () => {
    const { container } = render(
      <PassportDesktopHeroCard city="Reims" displayName="Repro" levelView={CASES.gold!} onOpenHistory={() => {}} />,
    );
    expect(text(container)).not.toContain("Prochain niveau");
  });
});

describe("carte de statut de la vue Offres", () => {
  it.each(Object.entries(CASES))("%s : libellé du tier, sans segments", (_name, levelView) => {
    const { container } = render(
      <PassportOffersStatusHero displayName="Repro" levelView={levelView} onOpenPassport={() => {}} />,
    );
    const t = text(container);
    expect(t).toContain(levelView.currentLabel);
    expect(t).not.toMatch(FORBIDDEN);
    expect(container.querySelectorAll("span.rounded-full.flex-1").length).toBe(0);
  });
});

describe("profil — aperçu desktop, bandeau medium, bandeau mobile", () => {
  it.each(Object.entries(CASES))("aperçu desktop, %s : libellé, sans barre ni compteur", (_name, levelView) => {
    const { container } = render(
      <ProfileDesktopGlance levelView={levelView} activeTribe={null} nextOuting={null} city="Reims" />,
    );
    const t = text(container);
    if (levelView.tierCode) expect(t).toContain(`Niveau ${levelView.currentLabel}`);
    else {
      expect(t).toContain("Niveau indisponible");
      expect(t).not.toContain("Niveau Niveau");
    }
    expect(t).not.toMatch(FORBIDDEN);
    expect(container.querySelectorAll('[style*="width"]').length).toBe(0);
  });

  it("aperçu desktop sans niveau du tout (null) : « Niveau indisponible », pas « Explorateur local »", () => {
    const { container } = render(<ProfileDesktopGlance levelView={null} activeTribe={null} nextOuting={null} city="Reims" />);
    expect(text(container)).toContain("Niveau indisponible");
    expect(text(container)).not.toMatch(FORBIDDEN);
  });

  it.each(Object.entries(CASES))("bandeau medium, %s : libellé, sans segments ni « N / T »", (_name, levelView) => {
    const { container } = render(<ProfileMediumPassportBanner levelView={levelView} />);
    expect(text(container)).toContain(levelView.currentLabel);
    expect(text(container)).not.toMatch(FORBIDDEN);
    expect(container.querySelectorAll("span.rounded-full.flex-1").length).toBe(0);
  });

  it.each(Object.entries(CASES))("bandeau mobile, %s : libellé, ni XP ni barre", (_name, levelView) => {
    const { container } = render(<ProfileMobileLevelBanner levelView={levelView} />);
    expect(text(container)).toContain(levelView.currentLabel);
    expect(text(container)).not.toMatch(FORBIDDEN);
    expect(container.querySelectorAll('[role="progressbar"]').length).toBe(0);
  });
});
