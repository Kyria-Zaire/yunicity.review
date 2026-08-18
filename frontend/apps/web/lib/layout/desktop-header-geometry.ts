/**
 * Contrat géométrique du header desktop (C3.1-T3-R6).
 * Utilisé par les tests unitaires et Playwright pour détecter les collisions.
 */

export const DESKTOP_HEADER_MIN_GAP_PX = 4;

/** Paliers d'acceptation desktop (px) — pas de nouveaux breakpoints produit. */
export const DESKTOP_HEADER_ACCEPTANCE_WIDTHS = [1280, 1366, 1440, 1536] as const;

export const DESKTOP_HEADER_CONTROL_IDS = [
  "logo",
  "destination-feed",
  "destination-videos",
  "destination-map",
  "destination-sortir",
  "explorer",
  "create",
  "menu",
  "notifications",
  "account",
] as const;

export type DesktopHeaderControlId = (typeof DESKTOP_HEADER_CONTROL_IDS)[number];

export type HeaderControlRect = {
  id: DesktopHeaderControlId;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

export function destinationControlId(href: string): DesktopHeaderControlId {
  switch (href) {
    case "/feed":
      return "destination-feed";
    case "/videos":
      return "destination-videos";
    case "/map":
      return "destination-map";
    case "/sortir":
      return "destination-sortir";
    default:
      throw new Error(`Unexpected destination href: ${href}`);
  }
}

export function rectsOverlap(
  a: Pick<HeaderControlRect, "left" | "right" | "top" | "bottom">,
  b: Pick<HeaderControlRect, "left" | "right" | "top" | "bottom">,
  minGap = 0,
): boolean {
  return !(
    a.right + minGap <= b.left ||
    b.right + minGap <= a.left ||
    a.bottom + minGap <= b.top ||
    b.bottom + minGap <= a.top
  );
}

export function findOverlappingPairs(
  rects: HeaderControlRect[],
  minGap = DESKTOP_HEADER_MIN_GAP_PX,
): Array<[DesktopHeaderControlId, DesktopHeaderControlId]> {
  const pairs: Array<[DesktopHeaderControlId, DesktopHeaderControlId]> = [];
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const b = rects[j];
      if (a && b && rectsOverlap(a, b, minGap)) {
        pairs.push([a.id, b.id]);
      }
    }
  }
  return pairs;
}

export function allControlsWithinViewport(
  rects: HeaderControlRect[],
  viewportWidth: number,
  tolerance = 1,
): boolean {
  return rects.every(
    (rect) => rect.left >= -tolerance && rect.right <= viewportWidth + tolerance,
  );
}

export function minInteractiveTargetSize(
  rects: HeaderControlRect[],
  ids: DesktopHeaderControlId[],
  minSize = 44,
): boolean {
  const selected = rects.filter((rect) => ids.includes(rect.id));
  return selected.every((rect) => rect.width >= minSize && rect.height >= minSize);
}
