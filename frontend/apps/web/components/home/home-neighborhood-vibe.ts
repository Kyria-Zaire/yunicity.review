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
  const ambiance = (neighborhood.ambiance ?? "").toLowerCase();
  if (ambiance.includes("calme") || ambiance.includes("tranquille") || ambiance.includes("quiet")) {
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
