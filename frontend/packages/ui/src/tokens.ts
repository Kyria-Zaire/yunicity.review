import { legacyUiColors, yunicityBrand } from "./brand-tokens";

/** @deprecated Préférer `yunicityBrand` depuis `@yunicity/ui` */
export const colors = legacyUiColors;

export { yunicityBrand };

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
} as const;

export const radius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
} as const;
