import type { Metadata } from "next";

import { getAbsoluteUrl, getDefaultOgImageUrl } from "./site";

export const SITE_NAME = "Yunicity";

export const SITE_DEFAULT_METADATA = {
  siteName: SITE_NAME,
  defaultTitle: "Yunicity — Activités, lieux et événements à Reims",
  defaultDescription:
    "Découvrez quoi faire à Reims : événements, lieux culturels, créateurs locaux et offres Passport. Yunicity reconnecte les Rémois à leur ville.",
  keywords: [
    "Reims",
    "activités Reims",
    "sortir Reims",
    "événements Reims",
    "lieux culturels Reims",
    "réseau social local",
    "Yunicity",
  ],
} as const;

export type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  absoluteTitle?: boolean;
};

export function truncateForMeta(text: string, max = 160): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function plainTextExcerpt(text: string | null | undefined, max = 160): string {
  if (!text?.trim()) {
    return "";
  }
  const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return truncateForMeta(stripped, max);
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = getAbsoluteUrl(input.path);
  const image = input.image ?? getDefaultOgImageUrl();
  const robots = input.noIndex
    ? { index: false as const, follow: false as const }
    : { index: true as const, follow: true as const };

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical },
    robots,
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "fr_FR",
      type: input.type ?? "website",
      images: [{ url: image, alt: input.imageAlt ?? input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

export function buildNoIndexMetadata(title: string, description?: string): Metadata {
  return buildPageMetadata({
    title,
    description: description ?? SITE_DEFAULT_METADATA.defaultDescription,
    path: "/",
    noIndex: true,
    absoluteTitle: true,
  });
}
