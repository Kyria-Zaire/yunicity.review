import { yunicityBrand } from "@/constants/brand";

/**
 * Palette Passport mobile — carte premium claire, accent brand (TICKET-306F).
 * Pas de dark block agressif ni de gradient.
 */
export const passportTheme = {
  bg: yunicityBrand.background,
  bgCard: yunicityBrand.background,
  bgElevated: yunicityBrand.surface,
  text: yunicityBrand.textPrimary,
  textMuted: yunicityBrand.textSecondary,
  textSubtle: yunicityBrand.textSecondary,
  accent: yunicityBrand.primary,
  accentSoft: yunicityBrand.primarySoft,
  border: yunicityBrand.border,
  borderAccent: "rgba(42, 47, 255, 0.2)",
  success: yunicityBrand.success,
  error: yunicityBrand.danger,
  radius: 20,
  radiusSm: 12,
} as const;
