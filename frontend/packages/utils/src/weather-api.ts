import type { WeatherCurrent } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class WeatherApi extends ApiClientBase {
  async getCurrentWeather(params: {
    lat?: number;
    lon?: number;
    city?: string;
  }): Promise<WeatherCurrent> {
    const search = new URLSearchParams();
    if (params.lat !== undefined) search.set("lat", String(params.lat));
    if (params.lon !== undefined) search.set("lon", String(params.lon));
    if (params.city) search.set("city", params.city);

    const qs = search.toString();
    return this.getJson<WeatherCurrent>(`/weather/current${qs ? `?${qs}` : ""}`);
  }
}

export function createWeatherApi(client: AuthClient, apiBaseUrl: string): WeatherApi {
  return new WeatherApi(client, apiBaseUrl);
}

