import type { NeighborhoodsDesktopAmbianceId } from "./neighborhoods-desktop-presenter";
import {
  NEIGHBORHOODS_DESKTOP_AMBIANCE_CULTURAL,
  NEIGHBORHOODS_DESKTOP_AMBIANCE_FAMILY,
  NEIGHBORHOODS_DESKTOP_AMBIANCE_GREEN,
  NEIGHBORHOODS_DESKTOP_AMBIANCE_LIVELY,
  NEIGHBORHOODS_DESKTOP_AMBIANCE_STUDENT,
} from "./neighborhoods-desktop-labels";
import { NEIGHBORHOODS_MEDIUM_CHIP_ALL } from "./neighborhoods-medium-labels";

export type NeighborhoodsMediumChipId = "all" | NeighborhoodsDesktopAmbianceId;

export type NeighborhoodsMediumChip = {
  id: NeighborhoodsMediumChipId;
  label: string;
  tone: "primary" | "peach" | "purple" | "yellow" | "blue" | "green";
};

/** Chips ambiance medium (maquette) — sans « Calme » pour rester compact. */
export const NEIGHBORHOODS_MEDIUM_AMBIANCE_CHIPS: NeighborhoodsMediumChip[] = [
  { id: "all", label: NEIGHBORHOODS_MEDIUM_CHIP_ALL, tone: "primary" },
  { id: "lively", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_LIVELY, tone: "peach" },
  { id: "cultural", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_CULTURAL, tone: "purple" },
  { id: "family", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_FAMILY, tone: "yellow" },
  { id: "student", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_STUDENT, tone: "blue" },
  { id: "green", label: NEIGHBORHOODS_DESKTOP_AMBIANCE_GREEN, tone: "green" },
];

export function neighborhoodsMediumActiveFilterCount(input: {
  ambiances: NeighborhoodsDesktopAmbianceId[];
  query: string;
}): number {
  let count = input.ambiances.length;
  if (input.query.trim()) count += 1;
  return count;
}

export function neighborhoodsMediumAmbiancesFromChip(
  chipId: NeighborhoodsMediumChipId,
): NeighborhoodsDesktopAmbianceId[] {
  if (chipId === "all") return [];
  return [chipId];
}

export function neighborhoodsMediumSelectedChip(
  ambiances: NeighborhoodsDesktopAmbianceId[],
): NeighborhoodsMediumChipId {
  if (ambiances.length === 1) {
    const only = ambiances[0]!;
    if (NEIGHBORHOODS_MEDIUM_AMBIANCE_CHIPS.some((chip) => chip.id === only)) {
      return only;
    }
  }
  return "all";
}
