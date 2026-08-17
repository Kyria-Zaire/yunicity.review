import { expect, type Locator, type Page } from "@playwright/test";

import { COLD_START_TIMEOUT, gotoCold } from "./cold-start";

const SESSION_LOADER = /^Chargement de la session…$/;

export type LandmarkState = {
  main: number;
  nestedMain: number;
  roleMainConcurrent: number;
  visibleMainNavigation: number;
};

export async function waitForCitizenRouteReady(
  page: Page,
  path: string,
  expectedUrl: RegExp,
  authoritativeContent: Locator,
): Promise<void> {
  await gotoCold(page, path, expectedUrl);
  await expect(page.getByText(SESSION_LOADER)).toHaveCount(0, { timeout: COLD_START_TIMEOUT });
  await expect(page).toHaveURL(expectedUrl, { timeout: COLD_START_TIMEOUT });
  await expect(page.locator('nav[aria-label="Navigation principale"]:visible')).toHaveCount(1, {
    timeout: COLD_START_TIMEOUT,
  });
  await expect(authoritativeContent, `contenu autoritaire absent sur ${path}`).toBeVisible({
    timeout: COLD_START_TIMEOUT,
  });
}

export async function readLandmarkState(page: Page): Promise<LandmarkState> {
  return page.evaluate(() => {
    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none"
      );
    };

    const visibleMainNavigation = Array.from(
      document.querySelectorAll('nav[aria-label="Navigation principale"]'),
    ).filter(isVisible).length;

    return {
      main: document.querySelectorAll("main").length,
      nestedMain: document.querySelectorAll("main main").length,
      roleMainConcurrent: document.querySelectorAll('[role="main"]').length,
      visibleMainNavigation,
    };
  });
}

export function expectExactlyOneMain(state: LandmarkState, route: string): void {
  expect(state.main, `${route} doit rendre exactement un <main>`).toBe(1);
  expect(state.nestedMain, `<main> imbriqué sur ${route}`).toBe(0);
  expect(state.roleMainConcurrent, `role="main" concurrent sur ${route}`).toBe(0);
  expect(state.visibleMainNavigation, `navigation principale visible sur ${route}`).toBe(1);
}
