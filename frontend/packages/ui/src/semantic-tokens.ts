/**
 * Semantic design tokens — Yunicity « Le pouls du quartier » (C3.0-T2).
 *
 * Couche SÉMANTIQUE au-dessus des primitives de marque (`brand-tokens.ts`).
 * Règle : réutiliser les valeurs existantes avant d'en créer. Chaque couleur
 * neutre ci-dessous consolide une valeur DÉJÀ utilisée ad hoc dans le web
 * (ex. `#F3F4F6` divider, `#F0FDF4` success-soft) en un token nommé unique.
 *
 * Ce module n'implémente aucune surface : il fournit le vocabulaire partagé
 * consommable via CSS variables (`brand.css`), Tailwind (`tailwind-preset.ts`)
 * et React/TS (import direct).
 */
import { yunicityBrand } from "./brand-tokens";

/** Échelle neutre — valeurs déjà présentes dans le code, nommées une seule fois. */
const neutral = {
  0: "#FFFFFF", // canvas / inverse
  50: yunicityBrand.surface, // #F7F8FA — surfaces secondaires
  100: "#F3F4F6", // divider (ad hoc ×51 dans le web)
  200: yunicityBrand.border, // #E5E7EB — bordures
  400: "#9CA3AF", // texte muted (gray-400)
  500: yunicityBrand.textSecondary, // #6B7280 — texte secondaire
  900: yunicityBrand.textPrimary, // #111827 — texte primaire
} as const;

export const yunicitySemantic = {
  color: {
    // Marque / accent (bleu-led, cf. DA)
    brand: yunicityBrand.primary,
    brandHover: yunicityBrand.primaryHover,
    brandSoft: yunicityBrand.primarySoft,
    brandContrast: neutral[0],
    accent: yunicityBrand.primary,

    // Surfaces (blanc dominant, cf. doctrine 306F)
    canvas: yunicityBrand.background, // #FFFFFF — fond de page
    surface: neutral[50], // #F7F8FA — zones secondaires
    surfaceElevated: neutral[0], // #FFFFFF — cartes sur canvas

    // Texte
    textPrimary: neutral[900],
    textSecondary: neutral[500],
    textMuted: neutral[400],
    textInverse: neutral[0],

    // Séparation & focus
    border: neutral[200],
    divider: neutral[100],
    focusRing: yunicityBrand.primary,

    // États métier (+ variantes soft de fond, déjà utilisées ad hoc)
    success: yunicityBrand.success,
    successSoft: "#F0FDF4",
    warning: yunicityBrand.warning,
    warningSoft: "#FFFBEB",
    danger: yunicityBrand.danger,
    dangerSoft: "#FFF1F2",
    info: "#2563EB",
    infoSoft: "#EFF6FF",

    // Passport premium — surface navy PLEINE de la carte identité. Validée DA : #0B1533
    // (pas de gradient, pas de glassmorphism — cf. doctrine 306F).
    premiumSurface: "#0B1533",
    premiumForeground: neutral[0],
    premiumAccent: yunicityBrand.primarySoft,

    // États interactifs
    interactiveHoverSurface: yunicityBrand.primarySoft,
  },

  /** Rayons — conserve sm/md/lg existants, ajoute xl/2xl (cartes) + pill. */
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem", // rounded-2xl — carte standard
    "2xl": "1.5rem", // rounded-3xl — hero
    pill: "9999px",
  },

  /** Ombres sobres (doctrine : pas d'ombres lourdes). */
  shadow: {
    sm: "0 1px 2px 0 rgb(17 24 39 / 0.05)",
    md: "0 4px 12px -2px rgb(17 24 39 / 0.10)",
    lg: "0 12px 32px -8px rgb(17 24 39 / 0.16)",
  },

  /** Espacement — échelle 4/8px (doctrine §3). */
  space: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    12: "3rem",
  },

  /** Largeurs de contenu — reprend `WEB_CONTENT_WIDTH_CLASS` (form/readable/wide) + shell. */
  content: {
    form: "36rem", // max-w-xl
    readable: "42rem", // max-w-2xl
    wide: "48rem", // max-w-3xl
    shellMax: "87.5rem", // 1400px — conteneur citoyen (usage ×20)
    shellSecondary: "68.75rem", // 1100px
  },

  /** Rails — sourcés des grilles existantes (sidebar 15rem, context 17-18rem). */
  rail: {
    nav: "15rem",
    navMedium: "12rem",
    context: "18rem",
  },

  /** Dimensions de chrome & cibles tactiles. */
  size: {
    headerHeight: "3.5rem", // 56px (h-14)
    bottomNavHeight: "4rem", // 64px
    touchMin: "2.75rem", // 44px — WCAG 2.1 AA
  },

  /** Z-index sémantiques — consolide les z-10/20/40/50/60/70 ad hoc en échelle nommée. */
  z: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    drawer: 40,
    modal: 50,
    popover: 60,
    toast: 70,
  },

  /** Mouvement — doctrine : 150-250ms UI, ease-out doux, respect reduced-motion. */
  motion: {
    durationFast: "150ms",
    durationBase: "200ms",
    durationSlow: "300ms",
    easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
    easingEmphasized: "cubic-bezier(0.3, 0, 0, 1)",
  },
} as const;

export type YunicitySemantic = typeof yunicitySemantic;
