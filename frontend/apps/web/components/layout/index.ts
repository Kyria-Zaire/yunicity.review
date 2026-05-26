/**
 * API layout web citoyen Yunicity — point d'entrée unique pour les pages authentifiées.
 *
 * Composition typique :
 * WebAppShell > WebContentColumn (+ WebContextPanel dans `context`)
 *
 * Composition avancée (futures pages complexes) :
 * WebResponsiveContainer > WebDesktopLayout > WebSidebar + main + WebContextRail
 */

export { WebAppShell, type WebAppShellProps } from "@/components/layout/web-app-shell";
export { WebContentColumn } from "@/components/layout/web-content-column";
export { WebContextPanel, WebContextAside } from "@/components/layout/web-context-panel";
export {
  WebContextDual,
  WebContextRail,
  WebContextStack,
} from "@/components/layout/web-context-rail";
export { WebDesktopLayout } from "@/components/layout/web-desktop-layout";
export { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
export { WebPageHeader, type WebPageHeaderProps } from "@/components/layout/web-page-header";
export { WebResponsiveContainer } from "@/components/layout/web-responsive-container";
export { WebSidebar } from "@/components/layout/web-sidebar";

export {
  WEB_CITIZEN_NAV,
  WEB_CITIZEN_NAV_PRIMARY,
  WEB_CITIZEN_NAV_SECONDARY,
  WEB_CONTENT_WIDTH_CLASS,
  isWebNavActive,
  type WebContentWidth,
  type WebNavIconId,
  type WebNavItem,
} from "@/lib/layout/web-layout-config";
