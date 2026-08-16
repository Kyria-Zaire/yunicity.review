/**
 * Primitives partagées C3.0 — surface publique du sous-chemin `@yunicity/ui/primitives`.
 *
 * WEB UNIQUEMENT (DOM). Volontairement HORS de `@yunicity/ui` racine : `apps/mobile` dépend
 * du package pour les tokens et ne doit jamais embarquer de composants DOM.
 *
 * Surface RÉDUITE AUX COMPOSANTS (C3.0-T3-R1). Les helpers d'implémentation
 * (`resolveTabTrap`, `acquireScrollLock`, `canCloseOverlay`, `hideBackgroundElements`,
 * `panelPositionClass`, `closedTransform`, `FOCUSABLE_SELECTOR`, `isActionable`, `cx`)
 * restent INTERNES : les exposer figerait des détails de mise en œuvre en contrat public.
 * Les tests les atteignent par chemin relatif.
 *
 * `OverlayPanel` n'est pas exporté non plus : `Sheet` et `Drawer` sont les deux seuls points
 * d'entrée overlay, pour qu'il n'existe pas de primitive concurrente du même rôle.
 */
export {
  Button,
  ButtonLink,
  type ButtonLinkProps,
  type ButtonProps,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from "./button";

export { Card, CardContent, CardFooter, CardHeader, type CardProps, type CardVariant } from "./card";

export { Sheet, type SheetProps } from "./overlay/sheet";
export { Drawer, type DrawerProps } from "./overlay/drawer";
export type { OverlayTriggerProps } from "./overlay/overlay-panel";

export { Skeleton, type SkeletonProps } from "./states/skeleton";
export type { StateAction } from "./states/state-action";
export {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineState,
  type EmptyStateProps,
  type ErrorStateProps,
  type LoadingStateProps,
  type OfflineStateProps,
} from "./states/system-states";
