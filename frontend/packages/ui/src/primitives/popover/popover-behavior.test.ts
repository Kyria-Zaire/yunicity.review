import { describe, expect, it } from "vitest";

import {
  computePopoverPosition,
  shouldRestorePopoverFocus,
  type PopoverPlacement,
  type PopoverRect,
  type PopoverViewport,
} from "./popover-behavior";

describe("shouldRestorePopoverFocus", () => {
  it("restaure uniquement pour escape et programmatic avec focus interne + déclencheur connecté", () => {
    expect(shouldRestorePopoverFocus("escape", true, true)).toBe(true);
    expect(shouldRestorePopoverFocus("outside-pointer", true, true)).toBe(false);
    expect(shouldRestorePopoverFocus("focus-exit", true, true)).toBe(false);
    expect(shouldRestorePopoverFocus("navigation", true, true)).toBe(false);
    expect(shouldRestorePopoverFocus("superseded", true, true)).toBe(false);
    expect(shouldRestorePopoverFocus("programmatic", true, true)).toBe(true);
    expect(shouldRestorePopoverFocus("programmatic", false, true)).toBe(false);
    expect(shouldRestorePopoverFocus("programmatic", true, false)).toBe(false);
  });
});

describe("computePopoverPosition", () => {
  const trigger: PopoverRect = { top: 100, left: 200, width: 120, height: 40 };
  const panel = { width: 240, height: 160 };
  const viewport: PopoverViewport = { width: 800, height: 600, scrollX: 0, scrollY: 0 };

  const placements: PopoverPlacement[] = [
    "bottom-start",
    "bottom-end",
    "top-start",
    "top-end",
    "right-start",
  ];

  it.each(placements)("ancre %s sous le déclencheur avec un gap", (placement) => {
    const result = computePopoverPosition(placement, trigger, panel, viewport);
    expect(result.top).toBeGreaterThanOrEqual(0);
    expect(result.left).toBeGreaterThanOrEqual(0);
    expect(result.top + panel.height).toBeLessThanOrEqual(viewport.height);
    expect(result.left + panel.width).toBeLessThanOrEqual(viewport.width);
  });

  it("place bottom-start sous le déclencheur aligné à gauche", () => {
    const result = computePopoverPosition("bottom-start", trigger, panel, viewport);
    expect(result.top).toBe(trigger.top + trigger.height + 8);
    expect(result.left).toBe(trigger.left);
    expect(result.resolvedPlacement).toBe("bottom-start");
  });

  it("place bottom-end sous le déclencheur aligné à droite", () => {
    const result = computePopoverPosition("bottom-end", trigger, panel, viewport);
    expect(result.top).toBe(trigger.top + trigger.height + 8);
    expect(result.left).toBe(trigger.left + trigger.width - panel.width);
  });

  it("place top-start au-dessus du déclencheur aligné à gauche", () => {
    const lowerTrigger: PopoverRect = { top: 200, left: 200, width: 120, height: 40 };
    const result = computePopoverPosition("top-start", lowerTrigger, panel, viewport);
    expect(result.top).toBe(lowerTrigger.top - panel.height - 8);
    expect(result.left).toBe(lowerTrigger.left);
  });

  it("place right-start à droite du déclencheur aligné en haut", () => {
    const result = computePopoverPosition("right-start", trigger, panel, viewport);
    expect(result.left).toBe(trigger.left + trigger.width + 8);
    expect(result.top).toBe(trigger.top);
  });

  it("clamp horizontalement quand le panneau dépasse à droite", () => {
    const narrowViewport: PopoverViewport = { width: 300, height: 600, scrollX: 0, scrollY: 0 };
    const wideTrigger: PopoverRect = { top: 100, left: 250, width: 40, height: 40 };
    const result = computePopoverPosition("bottom-start", wideTrigger, panel, narrowViewport);
    expect(result.left + panel.width).toBeLessThanOrEqual(narrowViewport.width - 8);
    expect(result.left).toBeGreaterThanOrEqual(8);
  });

  it("clamp verticalement quand le panneau dépasse en bas", () => {
    const lowViewport: PopoverViewport = { width: 800, height: 200, scrollX: 0, scrollY: 0 };
    const lowTrigger: PopoverRect = { top: 150, left: 200, width: 120, height: 40 };
    const result = computePopoverPosition("bottom-start", lowTrigger, panel, lowViewport);
    expect(result.top + panel.height).toBeLessThanOrEqual(lowViewport.height - 8);
  });

  it("conserve l'ancrage viewport d'un rect getBoundingClientRect même si le document a défilé", () => {
    const scrolled: PopoverViewport = { width: 800, height: 600, scrollX: 50, scrollY: 100 };
    const result = computePopoverPosition("bottom-start", trigger, panel, scrolled);
    expect(result.top).toBe(trigger.top + trigger.height + 8);
    expect(result.left).toBe(trigger.left);
  });

  it("aligne bottom-end sur le bord droit d'un déclencheur desktop sans coller au bord gauche", () => {
    const desktopViewport: PopoverViewport = { width: 1366, height: 900, scrollX: 0, scrollY: 0 };
    const desktopTrigger: PopoverRect = { top: 18, left: 1174, width: 156, height: 44 };
    const desktopPanel = { width: 320, height: 420 };
    const result = computePopoverPosition("bottom-end", desktopTrigger, desktopPanel, desktopViewport);

    expect(result.top).toBe(desktopTrigger.top + desktopTrigger.height + 8);
    expect(result.left).toBe(desktopTrigger.left + desktopTrigger.width - desktopPanel.width);
    expect(result.left).toBeGreaterThan(8);
    expect(result.left + desktopPanel.width).toBeLessThanOrEqual(desktopViewport.width - 8);
  });

  it("borne le panneau au bord gauche quand bottom-end dépasserait", () => {
    const narrowViewport: PopoverViewport = { width: 400, height: 600, scrollX: 0, scrollY: 0 };
    const leftTrigger: PopoverRect = { top: 80, left: 12, width: 48, height: 40 };
    const widePanel = { width: 360, height: 120 };
    const result = computePopoverPosition("bottom-end", leftTrigger, widePanel, narrowViewport);

    expect(result.left).toBeGreaterThanOrEqual(8);
    expect(result.left + widePanel.width).toBeLessThanOrEqual(narrowViewport.width - 8);
  });

  it("borne le panneau au bord droit quand bottom-start dépasserait", () => {
    const desktopViewport: PopoverViewport = { width: 1366, height: 900, scrollX: 0, scrollY: 0 };
    const rightTrigger: PopoverRect = { top: 18, left: 1200, width: 140, height: 44 };
    const result = computePopoverPosition("bottom-start", rightTrigger, panel, desktopViewport);

    expect(result.left).toBeGreaterThanOrEqual(8);
    expect(result.left + panel.width).toBeLessThanOrEqual(desktopViewport.width - 8);
  });

  it("conserve l'ouverture sous le déclencheur et borne la hauteur au lieu de remonter le panneau", () => {
    const desktopViewport: PopoverViewport = { width: 1366, height: 900, scrollX: 0, scrollY: 0 };
    const desktopTrigger: PopoverRect = { top: 18, left: 1174, width: 156, height: 44 };
    const tallPanel = { width: 320, height: 880 };
    const result = computePopoverPosition("bottom-end", desktopTrigger, tallPanel, desktopViewport);

    expect(result.top).toBe(desktopTrigger.top + desktopTrigger.height + 8);
    expect(result.maxHeight).toBe(desktopViewport.height - 8 - result.top);
    expect(result.top + result.maxHeight).toBeLessThanOrEqual(desktopViewport.height - 8);
  });
});
