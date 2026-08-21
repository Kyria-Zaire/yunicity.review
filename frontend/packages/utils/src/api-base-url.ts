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

export type WebApiRuntime = "browser" | "server";

export function resolveWebApiBaseUrl(input: {
  publicApiUrl: string | undefined;
  proxyTarget: string | undefined;
  runtime: WebApiRuntime;
}): string {
  const publicUrl = input.publicApiUrl?.trim();
  if (publicUrl) {
    return publicUrl.replace(/\/$/, "");
  }
  if (input.runtime === "browser") {
    return "";
  }
  return getApiBaseUrl(input.proxyTarget, DEFAULT_API_URL);
}

export function getWebApiBaseUrl(): string {
  return resolveWebApiBaseUrl({
    publicApiUrl: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined,
    proxyTarget: typeof process !== "undefined" ? process.env.API_PROXY_TARGET : undefined,
    runtime: typeof window !== "undefined" ? "browser" : "server",
  });
}

export function getExpoApiBaseUrl(): string {
  return getApiBaseUrl(
    typeof process !== "undefined" ? process.env.EXPO_PUBLIC_API_URL : undefined,
  );
}
