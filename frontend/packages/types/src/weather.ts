/** Weather types (WEB-SEARCH-02A). */

export type WeatherCondition = string;

/**
 * Provenance de la reponse meteo (C3-D1.2-R3A).
 *
 * `development_stub` designe la preview locale deterministe du backend quand
 * aucune cle provider n'est configuree. Ses valeurs sont FABRIQUEES : aucun
 * consommateur ne doit les afficher comme une meteo reelle.
 */
export type WeatherSource = "provider" | "development_stub";

export interface WeatherCurrent {
  temperature: number;
  feels_like: number;
  condition: WeatherCondition;
  icon: string | null;
  sunrise: string | null;
  sunset: string | null;
  is_day: boolean;
  city: string;
  country: string | null;
  source: WeatherSource;
  /** Fournis uniquement par le provider reel ; absents sinon. */
  temperature_min?: number | null;
  temperature_max?: number | null;
  wind_speed?: number | null;
}

