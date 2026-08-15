import { yunicityBrand } from "./brand-tokens";
import { yunicitySemantic as s } from "./semantic-tokens";

/**
 * Extension Tailwind partagée web + admin.
 *
 * Additive : les clés `yunicity.*` historiques (`bg-yunicity-primary`, etc.) sont
 * CONSERVÉES à l'identique ; la couche sémantique C3.0-T2 ajoute des sous-clés et
 * des échelles (radius/shadow/z/maxWidth/spacing/motion) préfixées, sans modifier
 * les utilitaires Tailwind existants.
 */
export const yunicityTailwindExtend = {
  colors: {
    yunicity: {
      // --- historique (inchangé) ---
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
      // --- sémantique C3.0-T2 (additif) ---
      canvas: s.color.canvas,
      "surface-elevated": s.color.surfaceElevated,
      "text-muted": s.color.textMuted,
      "text-inverse": s.color.textInverse,
      divider: s.color.divider,
      focus: s.color.focusRing,
      "success-soft": s.color.successSoft,
      "warning-soft": s.color.warningSoft,
      "danger-soft": s.color.dangerSoft,
      info: s.color.info,
      "info-soft": s.color.infoSoft,
      premium: {
        DEFAULT: s.color.premiumSurface,
        fg: s.color.premiumForeground,
        accent: s.color.premiumAccent,
      },
    },
  },
  borderRadius: {
    "yunicity-sm": s.radius.sm,
    "yunicity-md": s.radius.md,
    "yunicity-lg": s.radius.lg,
    "yunicity-xl": s.radius.xl,
    "yunicity-2xl": s.radius["2xl"],
    "yunicity-pill": s.radius.pill,
  },
  boxShadow: {
    "yunicity-sm": s.shadow.sm,
    "yunicity-md": s.shadow.md,
    "yunicity-lg": s.shadow.lg,
  },
  zIndex: {
    dropdown: String(s.z.dropdown),
    sticky: String(s.z.sticky),
    drawer: String(s.z.drawer),
    modal: String(s.z.modal),
    popover: String(s.z.popover),
    toast: String(s.z.toast),
  },
  maxWidth: {
    "yunicity-form": s.content.form,
    "yunicity-readable": s.content.readable,
    "yunicity-wide": s.content.wide,
    "yunicity-shell": s.content.shellMax,
    "yunicity-shell-secondary": s.content.shellSecondary,
  },
  spacing: {
    "yunicity-header": s.size.headerHeight,
    "yunicity-bottom-nav": s.size.bottomNavHeight,
    "yunicity-touch": s.size.touchMin,
    "yunicity-rail": s.rail.nav,
    "yunicity-rail-context": s.rail.context,
  },
  transitionDuration: {
    "yunicity-fast": s.motion.durationFast,
    "yunicity-base": s.motion.durationBase,
    "yunicity-slow": s.motion.durationSlow,
  },
  transitionTimingFunction: {
    "yunicity-standard": s.motion.easingStandard,
    "yunicity-emphasized": s.motion.easingEmphasized,
  },
} as const;
