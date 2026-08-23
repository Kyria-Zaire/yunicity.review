import { expect, type Page } from "@playwright/test";

import { COLD_START_TIMEOUT } from "./cold-start";

/**
 * Atteint le bas RÉEL d'une page qui grandit encore (C3.1-R1G).
 *
 * Un `scrollTo(0, scrollHeight)` unique suivi d'une attente sur
 * `scrollY + innerHeight >= scrollHeight - 1` ne converge pas sur un fil riche :
 * les images en `loading="lazy"` se chargent au fur et à mesure et `scrollHeight`
 * augmente après le saut, si bien que la condition reste fausse indéfiniment.
 * Mesuré en run complet : le prédicat expirait alors qu'il passait sur une base
 * fraîchement seedée — l'issue dépendait donc de la quantité de données.
 *
 * On repousse donc le scroll à CHAQUE itération et on s'arrête quand la position
 * ne bouge plus sur deux lectures consécutives : la condition porte sur un état
 * réel de la page, ce n'est ni une pause ni un retry d'assertion.
 */
export async function scrollToStableBottom(page: Page): Promise<void> {
  let previous = Number.NaN;
  let stableReads = 0;

  await expect
    .poll(
      async () => {
        const offset = await page.evaluate(() => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          return Math.round(window.scrollY);
        });
        stableReads = offset === previous ? stableReads + 1 : 0;
        previous = offset;
        return stableReads;
      },
      { timeout: COLD_START_TIMEOUT },
    )
    .toBeGreaterThanOrEqual(2);

  // Le bas est effectivement atteint une fois la hauteur stabilisée.
  const atBottom = await page.evaluate(
    () =>
      Math.ceil(window.scrollY + window.innerHeight) >=
      document.documentElement.scrollHeight - 1,
  );
  expect(atBottom, "bas de page non atteint après stabilisation").toBe(true);
}
