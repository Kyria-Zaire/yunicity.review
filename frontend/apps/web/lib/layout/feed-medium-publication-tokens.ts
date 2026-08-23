/**
 * Contrat de rythme des cartes publication Feed medium (C3-FEED-M8).
 *
 * Source unique des tokens CSS portés par `[data-feed-medium-region="stream"]`
 * dans `globals.css`. Les valeurs numériques servent aux specs E2E — jamais
 * comme fallback visuel dans les composants.
 */
export const FEED_MEDIUM_PUBLICATION_PARTS = [
  "surface",
  "header",
  "identity",
  "meta",
  "body",
  "media",
  "actions",
] as const;

export type FeedMediumPublicationPart = (typeof FEED_MEDIUM_PUBLICATION_PARTS)[number];

/** Cibles tactiles minimales des actions FeedPost en medium (WCAG 2.5.5). */
export const FEED_MEDIUM_PUBLICATION_ACTION_MIN_PX = 44;

/** Rayon extérieur maximal des surfaces publication en medium. */
export const FEED_MEDIUM_PUBLICATION_BORDER_RADIUS_MAX_PX = 2;

/** Tolérance subpixel pour aligner deux cartes adjacentes. */
export const FEED_MEDIUM_PUBLICATION_ALIGN_TOLERANCE_PX = 1;

/** Mesure éditoriale interne unique (C3-FEED-M8.1) — 42rem / 672 px. */
export const FEED_MEDIUM_PUBLICATION_MEASURE_REM = 42;

export const FEED_MEDIUM_PUBLICATION_MEASURE_PX = 672;

/** Nom de la custom property CSS portée par la région stream. */
export const FEED_MEDIUM_PUBLICATION_MEASURE_CSS_VAR = "--feed-medium-publication-measure";

/** Noms des custom properties définies sur la région stream. */
export const FEED_MEDIUM_CARD_RHYTHM_CSS_VARS = {
  paddingInline: "--feed-medium-card-padding-inline",
  paddingBlock: "--feed-medium-card-padding-block",
  gapAvatar: "--feed-medium-card-gap-avatar",
  gapHeaderBody: "--feed-medium-card-gap-header-body",
  gapBodyMedia: "--feed-medium-card-gap-body-media",
  actionMinSize: "--feed-medium-card-action-min",
} as const;
