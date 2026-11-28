import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * RAIL-SHORT-VIEWPORT-01 — contrat CSS du défilement du rail medium.
 * Verrouille les règles dont dépendent la mise en page mesurée en Chromium
 * (passation du ticket) : jsdom ne calcule aucune mise en page.
 */

describe("globals.css — contrat du défilement du rail", () => {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const css = readFileSync(`${here}../../app/globals.css`, "utf-8");

  /** Corps d'un bloc `@media` exact, par comptage d'accolades. */
  function mediaBlock(query: string): string {
    const start = css.indexOf(`@media ${query} {`);
    expect(start, `bloc ${query} introuvable`).toBeGreaterThan(-1);
    let depth = 0;
    for (let i = css.indexOf("{", start); i < css.length; i += 1) {
      if (css[i] === "{") depth += 1;
      if (css[i] === "}") depth -= 1;
      if (depth === 0) return css.slice(start, i + 1);
    }
    throw new Error("bloc non fermé");
  }

  const short = mediaBlock("(min-width: 640px) and (max-width: 1023.98px) and (max-height: 479.98px)");

  it("lets the whole rail scroll below 480 px of height, and only there", () => {
    expect(short).toMatch(/\[data-citizen-medium-rail-body\]\s*\{[^}]*overflow-y:\s*auto/);
    expect(short).toMatch(/\[data-citizen-medium-rail-nav\]\s*\{[^}]*overflow:\s*visible/);
  });

  it("keeps a scroll padding on both scroll containers so a focused control never lands under a cue", () => {
    expect(css).toMatch(/\[data-citizen-medium-rail-nav\]\s*\{[^}]*scroll-padding-block:\s*1\.25rem/);
    expect(short).toMatch(/\[data-citizen-medium-rail-body\]\s*\{[^}]*scroll-padding-block:\s*1\.25rem/);
  });
});

describe("globals.css — barres natives du rail masquées", () => {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const css = readFileSync(`${here}../../app/globals.css`, "utf-8");

  it("hides the native scrollbar of both scroll containers (the rail shows its own cues)", () => {
    expect(css).toMatch(
      /\[data-citizen-medium-rail-nav\],\s*\[data-citizen-medium-rail-body\]\s*\{[^}]*scrollbar-width:\s*none/,
    );
    expect(css).toMatch(
      /\[data-citizen-medium-rail-nav\]::-webkit-scrollbar,\s*\[data-citizen-medium-rail-body\]::-webkit-scrollbar\s*\{[^}]*display:\s*none/,
    );
  });
});
