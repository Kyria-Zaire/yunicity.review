import {
  buildLoginUrlWithNext,
  isSearchQueryReady,
  resolveAuthReturnPath,
} from "@yunicity/utils";

export function resolveRealSearchCity(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function buildExplorerSearchPath(input?: {
  query?: string;
  city?: string | null;
}): string {
  const params = new URLSearchParams();
  const query = input?.query?.trim() ?? "";
  const city = resolveRealSearchCity(input?.city);

  if (query) params.set("q", query);
  if (city) params.set("city", city);

  const serialized = params.toString();
  return serialized ? `/search?${serialized}` : "/search";
}

export function buildExplorerLoginHref(input?: {
  query?: string;
  city?: string | null;
}): string {
  const returnPath = resolveAuthReturnPath(buildExplorerSearchPath(input), "/search");
  return buildLoginUrlWithNext(returnPath);
}

export const EXPLORER_VISITOR_HINT =
  "Connectez-vous pour rechercher dans Reims et accéder aux résultats.";

export const EXPLORER_EMPTY_RECENT_LABEL = "Aucune recherche récente";

export function shouldShowExplorerVisitorHint(isAuthenticated: boolean): boolean {
  return !isAuthenticated;
}

export function shouldShowExplorerEmptyRecent(input: {
  isAuthenticated: boolean;
  query: string;
  recentSearches?: readonly string[];
}): boolean {
  if (!input.isAuthenticated) return false;
  if (input.query.trim() !== "") return false;
  return (input.recentSearches?.length ?? 0) === 0;
}

export function isExplorerQuerySubmittable(query: string): boolean {
  return isSearchQueryReady(query);
}

const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';

export function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).closest !== "function") return false;
  return (target as HTMLElement).closest(EDITABLE_SELECTOR) !== null;
}

export type { SearchCityState } from "./search-city-state";
export {
  reduceSearchCityState,
  resolveSearchCityFromUrl,
} from "./search-city-state";
