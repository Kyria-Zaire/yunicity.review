/** Chemins et constantes brand Yunicity (mascotte YU). */

export const YUNICITY_MASCOT_PATH = "/brand/yunicity-mascot.png";
export const YUNICITY_MASCOT_ALT = "Yunicity";
export const YUNICITY_WORDMARK = "Yunicity";

export const YUNICITY_LOGO_SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

export type YunicityLogoSize = keyof typeof YUNICITY_LOGO_SIZES;
