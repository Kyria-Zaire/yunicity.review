/**
 * Action d'état système (C3.0-T3) — logique PURE.
 *
 * Règle : « pas de CTA mort ». Le type garantit déjà qu'une action a une destination
 * (`href`) ou un handler (`onClick`) ; `isActionable` protège en plus la frontière runtime
 * (données venues d'un appelant JS non typé) — un CTA sans action n'est jamais rendu.
 */
export type StateAction =
  | { label: string; onClick: () => void; href?: never }
  | { label: string; href: string; onClick?: never };

export function isActionable(action: StateAction | undefined | null): action is StateAction {
  if (!action) return false;
  if (typeof action.label !== "string" || action.label.trim() === "") return false;
  return typeof action.onClick === "function" || (typeof action.href === "string" && action.href !== "");
}
