import { describe, expect, it } from "vitest";

import {
  NAVIGATION_DESKTOP_MIN_PX,
  NAVIGATION_DESKTOP_MIN_QUERY,
  NAVIGATION_MOBILE_MAX_PX,
  NAVIGATION_MOBILE_MAX_QUERY,
  createInitialNavigationOverlayState,
  createResolvedNavigationOverlayState,
  reduceNavigationOverlayState,
  resolveExplorerSurface,
  resolveYunicityMenuSurface,
  shouldRestoreNavigationFocus,
} from "./navigation-surfaces";

describe("navigation-surfaces — constantes R4B", () => {
  it("réutilise les media-queries du chrome Desktop ≥1024", () => {
    expect(NAVIGATION_MOBILE_MAX_QUERY).toBe("(max-width: 639.98px)");
    expect(NAVIGATION_DESKTOP_MIN_QUERY).toBe("(min-width: 1024px)");
    expect(NAVIGATION_MOBILE_MAX_PX).toBe(639.98);
    expect(NAVIGATION_DESKTOP_MIN_PX).toBe(1024);
  });
});

describe("resolveExplorerSurface", () => {
  it("bascule drawer/dialog aux seuils T2", () => {
    expect(resolveExplorerSurface(639.98)).toBe("drawer");
    expect(resolveExplorerSurface(640)).toBe("dialog");
  });
});

describe("resolveYunicityMenuSurface", () => {
  it("bascule drawer/sheet/popover aux seuils R4B", () => {
    expect(resolveYunicityMenuSurface(639.98)).toBe("drawer");
    expect(resolveYunicityMenuSurface(640)).toBe("sheet");
    expect(resolveYunicityMenuSurface(1023.98)).toBe("sheet");
    expect(resolveYunicityMenuSurface(1024)).toBe("popover");
  });

  it("mappe correctement les viewports d'acceptation sans les introduire comme seuils", () => {
    expect(resolveYunicityMenuSurface(390)).toBe("drawer");
    expect(resolveYunicityMenuSurface(900)).toBe("sheet");
    expect(resolveYunicityMenuSurface(1366)).toBe("popover");
  });
});

describe("reduceNavigationOverlayState — exclusivité atomique", () => {
  it("ne permet qu'une seule surface active", () => {
    let state = createResolvedNavigationOverlayState(1366);
    state = reduceNavigationOverlayState(state, { type: "open", id: "menu" });
    expect(state.activeSurface).toBe("menu");

    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    expect(state.activeSurface).toBe("explorer");
    expect(state.lastCloseReason).toBe("superseded");
  });

  it("Menu puis Explorer ne laisse que Explorer actif", () => {
    let state = createResolvedNavigationOverlayState(900);
    state = reduceNavigationOverlayState(state, { type: "open", id: "menu" });
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    expect(state.activeSurface).toBe("explorer");
    expect(state.menuSurface).toBe("sheet");
    expect(state.explorerSurface).toBe("dialog");
  });

  it("Explorer puis Create ne laisse que Create actif", () => {
    let state = createResolvedNavigationOverlayState(900);
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    state = reduceNavigationOverlayState(state, { type: "open", id: "create" });
    expect(state.activeSurface).toBe("create");
    expect(state.lastCloseReason).toBe("superseded");
  });

  it("closeSurface ne ferme que la surface active", () => {
    let state = createResolvedNavigationOverlayState(1366);
    state = reduceNavigationOverlayState(state, { type: "open", id: "menu" });
    state = reduceNavigationOverlayState(state, { type: "close", id: "explorer", reason: "escape" });
    expect(state.activeSurface).toBe("menu");

    state = reduceNavigationOverlayState(state, { type: "close", id: "menu", reason: "escape" });
    expect(state.activeSurface).toBeNull();
    expect(state.lastCloseReason).toBe("escape");
  });

  it("superseded interdit la restauration du focus", () => {
    let state = createResolvedNavigationOverlayState(1366);
    state = reduceNavigationOverlayState(state, { type: "open", id: "menu" });
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    expect(state.lastCloseReason).toBe("superseded");
    expect(shouldRestoreNavigationFocus(state)).toBe(false);
  });
});

describe("reduceNavigationOverlayState — initialisation responsive client", () => {
  it("idle + null → drawer = idle (première résolution, pas un breakpoint)", () => {
    let state = createInitialNavigationOverlayState();
    expect(state.surfacesInitialized).toBe(false);
    expect(state.explorerSurface).toBeNull();

    state = reduceNavigationOverlayState(state, { type: "set-viewport", width: 390 });
    expect(state.surfacesInitialized).toBe(true);
    expect(state.explorerSurface).toBe("drawer");
    expect(state.activeSurface).toBeNull();
  });

  it("explorer actif + null → drawer = explorer reste actif", () => {
    let state = createInitialNavigationOverlayState();
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    expect(state.activeSurface).toBe("explorer");

    state = reduceNavigationOverlayState(state, { type: "set-viewport", width: 390 });
    expect(state.explorerSurface).toBe("drawer");
    expect(state.activeSurface).toBe("explorer");
  });

  it("explorer actif + null → dialog = explorer reste actif", () => {
    let state = createInitialNavigationOverlayState();
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });

    state = reduceNavigationOverlayState(state, { type: "set-viewport", width: 1366 });
    expect(state.explorerSurface).toBe("dialog");
    expect(state.activeSurface).toBe("explorer");
  });

  it("explorer actif + drawer → dialog = fermeture breakpoint", () => {
    let state = createResolvedNavigationOverlayState(390);
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });

    state = reduceNavigationOverlayState(state, { type: "set-viewport", width: 1366 });
    expect(state.explorerSurface).toBe("dialog");
    expect(state.activeSurface).toBeNull();
    expect(state.lastCloseReason).toBe("programmatic");
  });

  it("explorer actif + dialog → drawer = fermeture breakpoint", () => {
    let state = createResolvedNavigationOverlayState(1366);
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });

    state = reduceNavigationOverlayState(state, { type: "set-viewport", width: 390 });
    expect(state.explorerSurface).toBe("drawer");
    expect(state.activeSurface).toBeNull();
    expect(state.lastCloseReason).toBe("programmatic");
  });

  it("simule l'ancien bug SSR 1366→390 : ouverture avant init ne doit pas être perdue", () => {
    let state = createInitialNavigationOverlayState();
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    state = reduceNavigationOverlayState(state, { type: "set-viewport", width: 390 });
    expect(state.activeSurface).toBe("explorer");
    expect(state.explorerSurface).toBe("drawer");
  });
});
