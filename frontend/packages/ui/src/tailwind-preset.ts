import { yunicityBrand } from "./brand-tokens";

/** Extension Tailwind partagée web + admin */
export const yunicityTailwindExtend = {
  colors: {
    yunicity: {
      primary: {
        DEFAULT: yunicityBrand.primary,
        hover: yunicityBrand.primaryHover,
        soft: yunicityBrand.primarySoft,
      },
      surface: yunicityBrand.surface,
      border: yunicityBrand.border,
      ink: {
        DEFAULT: yunicityBrand.textPrimary,
        muted: yunicityBrand.textSecondary,
      },
      success: yunicityBrand.success,
      warning: yunicityBrand.warning,
      danger: yunicityBrand.danger,
    },
  },
} as const;
