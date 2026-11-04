/** Map desktop layout — MAP-DESKTOP-01. */

export const MAP_DESKTOP_THREE_COLUMN_MIN_PX = 1024;

export type MapDesktopRightRailMode = "discovery" | "detail";

/** Rail droit : découverte par défaut, fiche détail si sélection profonde. */
export function resolveMapDesktopRightRailMode(hasDetailRail: boolean): MapDesktopRightRailMode {
  return hasDetailRail ? "detail" : "discovery";
}

export function mapDesktopShowsPersistentLeftRail(viewportWidthPx: number): boolean {
  return viewportWidthPx >= MAP_DESKTOP_THREE_COLUMN_MIN_PX;
}

export function mapDesktopShowsPersistentRightRail(viewportWidthPx: number): boolean {
  return viewportWidthPx >= MAP_DESKTOP_THREE_COLUMN_MIN_PX;
}
