import type { Page } from "@playwright/test";
import { test } from "../fixtures";

/**
 * C3-FEED-R4B — audit des frontieres Desktop ≥1024.
 * Mesures console uniquement — aucune capture automatique.
 */

async function gotoFeed(page: Page): Promise<void> {
  await page.goto("/feed");
  await page.locator(".feed-main-column").first().waitFor({ state: "attached" });
  await page.waitForLoadState("networkidle");
}

test("audit frontieres R4B", async ({ authedPage: page }) => {
  const lines: string[] = [];
  const widths = [
    320, 344, 360, 414, 639, 640, 641, 719, 720, 1023, 1024, 1025, 1279, 1280, 1366,
  ] as const;

  for (const w of widths) {
    await page.setViewportSize({ width: w, height: w <= 414 ? 800 : w <= 720 ? 900 : 600 });
    await gotoFeed(page);

    const m = await page.evaluate(() => {
      const visible = (sel: string) => {
        const n = document.querySelector(sel);
        if (!n) return { present: 0, displayables: 0, display: null };
        const s = getComputedStyle(n);
        const r = n.getBoundingClientRect();
        const shown = s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
        const focusables = shown
          ? Array.from(n.querySelectorAll("a,button,[tabindex]")).filter((e) => {
              const b = e.getBoundingClientRect();
              return b.width > 0 && b.height > 0;
            }).length
          : 0;
        return {
          present: shown ? 1 : 0,
          display: s.display,
          focusables,
          rect: shown
            ? {
                w: Math.round(r.width),
                h: Math.round(r.height),
                left: Math.round(r.left),
                right: Math.round(r.right),
              }
            : null,
        };
      };

      const wordmark = document.querySelector(
        '[data-yunicity-mobile-header-control="logo"] a > span > span',
      );
      const wordmarkBox = wordmark?.getBoundingClientRect();
      const mediumRail = document.querySelector("[data-citizen-medium-rail]");
      const mediumRailStyle = mediumRail ? getComputedStyle(mediumRail) : null;

      return {
        innerWidth: window.innerWidth,
        visualWidth: Math.round(window.visualViewport?.width ?? 0),
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        mobileHeader: visible("header.web-mobile-feed-only"),
        bottomNav: visible(".web-mobile-strategic-bottom-nav"),
        mediumRail: visible("[data-citizen-medium-rail]"),
        mediumHeader: visible(".feed-medium-header"),
        topNav: visible(".citizen-top-nav"),
        leftRail: visible(".feed-desktop-left-rail"),
        rightRail: visible(".feed-desktop-right-rail"),
        desktopHeader: visible(".feed-shell-desktop-header"),
        column: visible(".feed-main-column"),
        shell: visible(".feed-shell"),
        wordmark: wordmark
          ? {
              text: wordmark.textContent?.trim() ?? "",
              w: Math.round(wordmarkBox?.width ?? 0),
              scrollW: wordmark.scrollWidth,
              clientW: wordmark.clientWidth,
              truncated: wordmark.scrollWidth > wordmark.clientWidth + 1,
            }
          : null,
        mediumRailWidth: mediumRailStyle
          ? Math.round(mediumRail!.getBoundingClientRect().width)
          : null,
      };
    });

    const mobileVisible = m.mobileHeader.present;
    const mediumVisible = m.mediumRail.present || m.mediumHeader.present;
    const desktopVisible = m.leftRail.present && m.rightRail.present && m.desktopHeader.present;

    lines.push(
      `--- ${w}px | inner=${m.innerWidth} visual=${m.visualWidth} client=${m.clientWidth} scroll=${m.scrollWidth} overflow=${m.scrollWidth === m.clientWidth ? "OK" : "FAIL"} ---`,
    );
    lines.push(
      `   shells: mobile=${mobileVisible} medium=${mediumVisible} desktop=${desktopVisible ? 1 : 0} bottomNav=${m.bottomNav.present}`,
    );
    lines.push(
      `   rails: medium=${JSON.stringify(m.mediumRail.rect)} left=${JSON.stringify(m.leftRail.rect)} right=${JSON.stringify(m.rightRail.rect)} col=${JSON.stringify(m.column.rect)}`,
    );
    lines.push(
      `   focusables: mediumRail=${m.mediumRail.focusables} left=${m.leftRail.focusables} right=${m.rightRail.focusables} mediumHeader=${m.mediumHeader.focusables}`,
    );
    if (m.wordmark) {
      lines.push(
        `   wordmark: text="${m.wordmark.text}" w=${m.wordmark.w}px truncated=${m.wordmark.truncated}`,
      );
    }
    if (m.mediumRailWidth != null) {
      lines.push(`   mediumRailWidth=${m.mediumRailWidth}px`);
    }
  }

  console.log("\n===== AUDIT R4B =====");
  for (const l of lines) console.log(l);
  console.log("=====================\n");
});
