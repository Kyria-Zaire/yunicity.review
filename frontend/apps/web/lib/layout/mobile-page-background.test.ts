import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * MOBILE-PAGE-BG-01 — sur mobile, le fond de page reprend le fond de la vue
 * affichée, pour que l'espace de fin de contenu (au-dessus de la barre basse)
 * ne forme pas de bande d'une autre couleur.
 *
 * Chaque règle de `globals.css` est rattachée à une vue : si la vue change de
 * fond, ce test signale que la règle doit suivre.
 */
const lire = (relatif: string) => readFileSync(fileURLToPath(new URL(relatif, import.meta.url)), "utf8");

const css = lire("../../app/globals.css");
const blocMobile = (() => {
  const debut = css.indexOf("/* MOBILE-PAGE-BG-01");
  expect(debut, "bloc MOBILE-PAGE-BG-01 introuvable").toBeGreaterThan(-1);
  return css.slice(debut);
})();

const CORRESPONDANCES = [
  { selecteur: ".neighborhoods-mobile-shell:has([data-neighborhoods-mobile-hub])", vue: "../../components/neighborhoods/mobile/neighborhoods-mobile-screen.tsx", fond: "bg-[#F4F5F7]", couleur: "#f4f5f7" },
  { selecteur: ".notifications-mobile-shell:has([data-notifications-mobile])", vue: "../../components/notifications/mobile/notifications-mobile-view.tsx", fond: "bg-[#F4F5F7]", couleur: "#f4f5f7" },
  { selecteur: ".settings-mobile-shell:has(.web-mobile-settings-only)", vue: "../../components/settings/mobile/settings-mobile-view.tsx", fond: "bg-[#F4F5F7]", couleur: "#f4f5f7" },
  { selecteur: ".tribes-mobile-shell:has([data-tribes-mobile-root])", vue: "../../components/tribes/mobile/tribes-mobile-view.tsx", fond: "bg-[#F4F5F7]", couleur: "#f4f5f7" },
  { selecteur: ".profile-mobile-shell:has(.web-mobile-profile-portal-only)", vue: "../../components/profile/mobile/profile-mobile-view.tsx", fond: "bg-[#F4F5F7]", couleur: "#f4f5f7" },
  { selecteur: ".event-detail-mobile-shell:has([data-event-mobile-detail])", vue: "../../components/events/mobile/event-mobile-detail-view.tsx", fond: "bg-[#F4F5F7]", couleur: "#f4f5f7" },
  { selecteur: ".tribes-mobile-shell:has(.tribe-detail-mobile-shell)", vue: "../../components/tribes/mobile/tribe-detail-mobile-view.tsx", fond: "bg-neutral-50", couleur: 'theme("colors.neutral.50")' },
] as const;

describe("fond de page mobile = fond de la vue (MOBILE-PAGE-BG-01)", () => {
  it("ne s'applique qu'au palier mobile", () => {
    expect(blocMobile).toMatch(/^\/\*[\s\S]*?\*\/\s*@media \(max-width: 639\.98px\) \{/);
  });

  it.each(CORRESPONDANCES)("$selecteur reprend le fond déclaré par sa vue ($fond)", ({ selecteur, vue, fond, couleur }) => {
    expect(lire(vue)).toContain(fond);
    const regle = blocMobile.slice(blocMobile.indexOf(selecteur));
    expect(blocMobile).toContain(selecteur);
    expect(regle.slice(0, regle.indexOf("}"))).toContain(`background-color: ${couleur};`);
  });
});
