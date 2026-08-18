import { describe, expect, it } from "vitest";

import {
  createResolvedNavigationOverlayState,
  reduceNavigationOverlayState,
  shouldRestoreNavigationFocus,
} from "./navigation-surfaces";

describe("NavigationOverlayCoordinator — exclusivité (pur)", () => {
  it("Menu puis Explorer ne laisse qu'Explorer (Ctrl/Meta+K simulé)", () => {
    let state = createResolvedNavigationOverlayState(1366);
    state = reduceNavigationOverlayState(state, { type: "open", id: "menu" });
    expect(state.menuSurface).toBe("popover");

    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    expect(state.activeSurface).toBe("explorer");
    expect(state.explorerSurface).toBe("dialog");
    expect(state.lastCloseReason).toBe("superseded");
    expect(shouldRestoreNavigationFocus(state)).toBe(false);
  });

  it("Explorer puis Create ne laisse que Create", () => {
    let state = createResolvedNavigationOverlayState(900);
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    state = reduceNavigationOverlayState(state, { type: "open", id: "create" });
    expect(state.activeSurface).toBe("create");
    expect(state.lastCloseReason).toBe("superseded");
  });

  it("Popover Menu remplacé par Dialog Explorer sur desktop", () => {
    let state = createResolvedNavigationOverlayState(1366);
    expect(state.menuSurface).toBe("popover");
    expect(state.explorerSurface).toBe("dialog");

    state = reduceNavigationOverlayState(state, { type: "open", id: "menu" });
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    expect(state.activeSurface).toBe("explorer");
    expect(state.menuSurface).toBe("popover");
    expect(state.explorerSurface).toBe("dialog");
  });

  it("Drawer Menu remplacé par Dialog Explorer sur mobile", () => {
    let state = createResolvedNavigationOverlayState(390);
    expect(state.menuSurface).toBe("drawer");
    expect(state.explorerSurface).toBe("drawer");

    state = reduceNavigationOverlayState(state, { type: "open", id: "menu" });
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    expect(state.activeSurface).toBe("explorer");
  });

  it("Sheet Menu remplacé par Dialog Explorer sur medium", () => {
    let state = createResolvedNavigationOverlayState(900);
    state = reduceNavigationOverlayState(state, { type: "open", id: "menu" });
    state = reduceNavigationOverlayState(state, { type: "open", id: "explorer" });
    expect(state.menuSurface).toBe("sheet");
    expect(state.explorerSurface).toBe("dialog");
    expect(state.activeSurface).toBe("explorer");
  });

  it("met à jour les surfaces dérivées au changement viewport sans double surface", () => {
    let state = createResolvedNavigationOverlayState(390);
    state = reduceNavigationOverlayState(state, { type: "open", id: "menu" });
    state = reduceNavigationOverlayState(state, { type: "set-viewport", width: 1366 });
    expect(state.menuSurface).toBe("popover");
    expect(state.activeSurface).toBeNull();
    expect(state.lastCloseReason).toBe("programmatic");
  });
});
