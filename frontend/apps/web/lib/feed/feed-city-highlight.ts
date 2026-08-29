/**
 * Image territoriale pour le widget météo du rail feed (desktop).
 */

export const FEED_WEATHER_NOTRE_DAME_IMAGE_URL = "/feed/notre-dame.png";

const CITY_HIGHLIGHT_IMAGES: Readonly<Record<string, string>> = {
  reims: FEED_WEATHER_NOTRE_DAME_IMAGE_URL,
};

export function resolveFeedCityHighlightImage(city: string): string | null {
  const key = city.trim().toLowerCase();
  if (!key) return null;
  return CITY_HIGHLIGHT_IMAGES[key] ?? null;
}
