import type { PartnerCreatorContentPublic } from "@yunicity/types";

const EXCERPT_MAX_LENGTH = 160;

export function formatPartnerCreatorContentExcerpt(
  body: string | null | undefined,
  maxLength: number = EXCERPT_MAX_LENGTH,
): string {
  const trimmed = (body ?? "").trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function formatPartnerCreatorContentPublishedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function hasPartnerCreatorContentMedia(
  item: Pick<PartnerCreatorContentPublic, "media_url">,
): boolean {
  return Boolean(item.media_url?.trim());
}
