/**
 * Identité visuelle officielle Yunicity (TICKET-306F).
 * Source unique — web (Tailwind/CSS), mobile (StyleSheet), admin (shadcn).
 *
 * Règles : blanc dominant, bleu #2A2FFF pour guider l'attention, pas de gradients.
 */

export const yunicityBrand = {
  primary: "#2A2FFF",
  primaryHover: "#1F24D9",
  primarySoft: "#EEF0FF",

  background: "#FFFFFF",
  surface: "#F7F8FA",
  border: "#E5E7EB",

  textPrimary: "#111827",
  textSecondary: "#6B7280",

  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
} as const;

export type YunicityBrand = typeof yunicityBrand;

/** @deprecated Utiliser `yunicityBrand` — alias historique `colors` package ui */
export const legacyUiColors = {
  background: yunicityBrand.background,
  foreground: yunicityBrand.textPrimary,
  muted: yunicityBrand.textSecondary,
  border: yunicityBrand.border,
  primary: yunicityBrand.primary,
  success: yunicityBrand.success,
  warning: yunicityBrand.warning,
  error: yunicityBrand.danger,
} as const;
