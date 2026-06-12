import { YUNICITY_MASCOT_PATH } from "@yunicity/utils";

const DEFAULT_SITE_URL = "http://localhost:3000";
export const SEO_DEFAULT_CITY = "Reims";

export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_WEB_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = fromEnv || DEFAULT_SITE_URL;
  return url.replace(/\/$/, "");
}

export function getAbsoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export function getDefaultOgImageUrl(): string {
  return getAbsoluteUrl(YUNICITY_MASCOT_PATH);
}

export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) {
    return undefined;
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return getAbsoluteUrl(trimmed);
  }
  return trimmed;
}
