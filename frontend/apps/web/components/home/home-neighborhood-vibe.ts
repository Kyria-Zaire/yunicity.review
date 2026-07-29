import type { Neighborhood } from "@yunicity/types";
import {
  HOME_NEIGHBORHOOD_VIBE_ACTIVE,
  HOME_NEIGHBORHOOD_VIBE_CALM,
  HOME_NEIGHBORHOOD_VIBE_DISCOVER,
} from "@yunicity/utils";

export type NeighborhoodVibeLabel =
  | typeof HOME_NEIGHBORHOOD_VIBE_ACTIVE
  | typeof HOME_NEIGHBORHOOD_VIBE_CALM
  | typeof HOME_NEIGHBORHOOD_VIBE_DISCOVER;

export function neighborhoodVibeLabel(neighborhood: Neighborhood): NeighborhoodVibeLabel {
  if (neighborhood.is_featured) {
    return HOME_NEIGHBORHOOD_VIBE_DISCOVER;
  }
  // Aligne sur l'enum backend NeighborhoodAmbiance : calm/green = vibe paisible,
  // lively/cultural/student = vibe active. (Avant : includes("calme") ne matchait jamais "calm".)
  const ambiance = (neighborhood.ambiance ?? "").trim().toLowerCase();
  if (ambiance === "calm" || ambiance === "green") {
    return HOME_NEIGHBORHOOD_VIBE_CALM;
  }
  return HOME_NEIGHBORHOOD_VIBE_ACTIVE;
}

export function neighborhoodVibeTone(
  label: NeighborhoodVibeLabel,
): "active" | "calm" | "discover" {
  if (label === HOME_NEIGHBORHOOD_VIBE_DISCOVER) return "discover";
  if (label === HOME_NEIGHBORHOOD_VIBE_CALM) return "calm";
  return "active";
}
