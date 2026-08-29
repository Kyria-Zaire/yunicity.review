import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { test } from "../fixtures";

/**
 * C3-FEED-RESPONSIVE-SHELL-R4 — controle anti-masquage.
 *
 * Une mesure `scrollWidth === clientWidth` ne vaut que si aucun ancetre ne
 * clippe le debordement. Ce fichier prouve les deux ensemble : aucune regle ne
 * masque, ET rien ne deborde. Il verifie aussi que le pied du rail medium
 * contient reellement les commandes attendues, pas seulement un rectangle.
 */

async function gotoFeed(page: Page): Promise<void> {
  await page.goto("/feed");
  await page.locator(".feed-main-column").first().waitFor({ state: "attached" });
  await page.waitForLoadState("networkidle");
}

test.describe("R4 — la mesure d'overflow n'est pas masquee", () => {
  for (const { w, h } of [
    { w: 320, h: 800 },
    { w: 360, h: 740 },
    { w: 639, h: 900 },
    { w: 1024, h: 600 },
  ]) {
    test(`aucun ancetre du fil ne clippe l'axe horizontal — ${w}x${h}`, async ({
      authedPage: page,
    }) => {
      await page.setViewportSize({ width: w, height: h });
      await gotoFeed(page);

      const chain = await page.evaluate(() => {
        const column = document.querySelector(".feed-main-column");
        const clipping: Array<{ selector: string; overflowX: string; overflowY: string }> = [];
        let node: HTMLElement | null = column as HTMLElement | null;
        while (node && node !== document.documentElement) {
          const style = getComputedStyle(node);
          if (style.overflowX !== "visible") {
            clipping.push({
              selector: `${node.tagName.toLowerCase()}.${node.className?.toString().split(" ")[0] ?? ""}`,
              overflowX: style.overflowX,
              overflowY: style.overflowY,
            });
          }
          node = node.parentElement;
        }
        return {
          clipping,
          docScroll: document.documentElement.scrollWidth,
          docClient: document.documentElement.clientWidth,
        };
      });

      // Le shell du fil ne doit plus clipper : c'est ce clip qui tronquait la
      // navbar `position: fixed` et rendait la mesure d'overflow ininterpretable.
      const shellClips = chain.clipping.filter((entry) =>
        entry.selector.includes("web-shell-page"),
      );
      expect(shellClips, `ancetres clippants : ${JSON.stringify(chain.clipping)}`).toHaveLength(0);

      // Et, sans masque, rien ne deborde.
      expect(chain.docScroll).toBe(chain.docClient);
    });
  }
});

test.describe("R4 — commandes du rail medium", () => {
  for (const { w, h } of [
    { w: 640, h: 900 },
    { w: 640, h: 600 },
  ]) {
    test(`Creer, Notifications et Profil sont visibles — ${w}x${h}`, async ({
      authedPage: page,
    }) => {
      await page.setViewportSize({ width: w, height: h });
      await gotoFeed(page);

      const footer = await page.evaluate(() => {
        const node = document.querySelector("[data-citizen-medium-rail-footer]");
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        const entries = Array.from(node.querySelectorAll("a, button")).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            label: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40),
            top: r.top,
            bottom: r.bottom,
            visible: r.width > 0 && r.height > 0,
          };
        });
        return { rect: { top: rect.top, bottom: rect.bottom }, entries, viewportHeight: window.innerHeight };
      });

      expect(footer, "pied du rail present").not.toBeNull();
      expect(footer!.entries.length, "commandes presentes dans le pied").toBeGreaterThanOrEqual(3);

      for (const entry of footer!.entries) {
        expect(entry.visible, `commande dimensionnee : ${entry.label}`).toBe(true);
        expect(
          Math.round(entry.bottom),
          `commande dans le viewport a ${w}x${h} : ${entry.label}`,
        ).toBeLessThanOrEqual(Math.ceil(footer!.viewportHeight));
        expect(Math.round(entry.top), `commande non remontee hors ecran : ${entry.label}`)
          .toBeGreaterThanOrEqual(0);
      }
    });
  }
});
