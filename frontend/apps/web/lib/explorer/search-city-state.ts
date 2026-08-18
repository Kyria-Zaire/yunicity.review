export type SearchCityState =
  | { status: "loading" }
  | { status: "ready"; city: string }
  | { status: "missing" }
  | { status: "error"; retry: () => void };

export type ProfileCityFetchResult =
  | { type: "profile-pending" }
  | { type: "profile-success"; city: string | null | undefined; generation: number }
  | { type: "profile-error"; retry: () => void; generation: number };

export function resolveSearchCityFromUrl(urlCity: string | null | undefined): SearchCityState | null {
  const city = urlCity?.trim();
  if (!city) return null;
  return { status: "ready", city };
}

export function reduceSearchCityState(
  current: SearchCityState,
  event: ProfileCityFetchResult,
  activeGeneration: number,
): SearchCityState {
  if (event.type === "profile-pending") {
    return { status: "loading" };
  }

  if (event.generation !== activeGeneration) {
    return current;
  }

  if (event.type === "profile-error") {
    return { status: "error", retry: event.retry };
  }

  const city = event.city?.trim();
  if (city) {
    return { status: "ready", city };
  }

  return { status: "missing" };
}
