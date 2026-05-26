/** Web home / feed labels (WEB-HOME-01). */

export const HOME_PUBLISH_MOMENT = "Publier un moment";

export const HOME_WEATHER_TITLE = "Météo locale";

export const HOME_WEATHER_MOCK_NOTE = "Aperçu indicatif — pas de service météo connecté.";

export const HOME_EVENTS_THIS_WEEK = (city: string): string => `À ${city} cette semaine`;

export const HOME_NEIGHBORHOODS_TITLE = "Ambiance des quartiers";

export const HOME_NEIGHBORHOOD_VIBE_ACTIVE = "Actif";

export const HOME_NEIGHBORHOOD_VIBE_CALM = "Calme";

export const HOME_NEIGHBORHOOD_VIBE_DISCOVER = "À découvrir";

export const HOME_PRIVILEGE_TITLE = "Privilège local";

export const HOME_PASSPORT_PANEL_TITLE = "Mon Passport";

export const HOME_PASSPORT_CTA = "Ouvrir mon Passport";

export const HOME_LOCAL_TAGS_TITLE = "Thèmes locaux";

export const HOME_TRIBE_CTA_TITLE = "Rejoindre une tribu";

export const HOME_TRIBE_CTA_BODY =
  "Des communautés légères autour de vos passions à Reims — sans le bruit des grands réseaux.";

export const HOME_TRIBE_CTA_LINK = "Explorer les tribus";

export const HOME_VIEW_ALL_EVENTS = "Tous les moments";

export const HOME_VIEW_ALL_NEIGHBORHOODS = "Tous les quartiers";

export const HOME_EDITORIAL_TAGS = [
  { slug: "culture", label: "#culture" },
  { slug: "gastronomie", label: "#gastronomie" },
  { slug: "urbanisme", label: "#urbanisme" },
] as const;

const REIMS_GREETING = "Bonjour, Rémois";

export function homeGreeting(city: string): string {
  const normalized = city.trim().toLowerCase();
  if (normalized === "reims") {
    return REIMS_GREETING;
  }
  return `Bonjour, ${city.trim()}`;
}

export function homeComposerPlaceholder(city: string): string {
  const name = city.trim() || "Reims";
  return `Quoi de neuf à ${name} ?`;
}

export function homeComposerSubtitle(city: string): string {
  return `Partagez un moment local à ${city.trim() || "Reims"}…`;
}

/** Stable mock weather — no external API (WEB-HOME-01 exclusion). */
export function mockLocalWeather(city: string): { tempC: number; label: string } {
  const seed = city.trim().length + new Date().getDate();
  const temps = [11, 13, 15, 12, 14, 16];
  const labels = [
    "Nuages légers",
    "Éclaircies",
    "Ciel clair",
    "Brume matinale",
    "Douceur printanière",
    "Ciel voilé",
  ];
  const index = seed % temps.length;
  return { tempC: temps[index]!, label: labels[index]! };
}

export function isEventWithinDays(iso: string, days: number): boolean {
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) {
    return false;
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  return start >= now && start <= end;
}
