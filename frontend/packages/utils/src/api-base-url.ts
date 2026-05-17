const DEFAULT_API_URL = "http://localhost:8000";

export function getApiBaseUrl(
  envValue: string | undefined,
  fallback: string = DEFAULT_API_URL,
): string {
  const trimmed = envValue?.trim();
  if (!trimmed) {
    return fallback.replace(/\/$/, "");
  }
  return trimmed.replace(/\/$/, "");
}

export function getWebApiBaseUrl(): string {
  return getApiBaseUrl(
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined,
  );
}

export function getExpoApiBaseUrl(): string {
  return getApiBaseUrl(
    typeof process !== "undefined" ? process.env.EXPO_PUBLIC_API_URL : undefined,
  );
}
