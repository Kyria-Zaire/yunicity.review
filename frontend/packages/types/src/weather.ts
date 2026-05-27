/** Weather types (WEB-SEARCH-02A). */

export type WeatherCondition = string;

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
}

