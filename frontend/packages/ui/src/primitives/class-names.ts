/**
 * Concaténation de classes — volontairement minimale (C3.0-T3).
 *
 * Pas de `clsx` / `tailwind-merge` : ni l'un ni l'autre n'est déclaré côté `web`, et une
 * primitive du design system ne doit pas introduire de dépendance pour un `filter+join`.
 * Conséquence assumée : aucune résolution de conflit Tailwind. Les `className` passés par
 * le consommateur sont concaténés EN DERNIER (ils gagnent à spécificité égale) et doivent
 * rester des ajouts (espacement, largeur), pas des remplacements de tokens.
 */
export type ClassValue = string | false | null | undefined;

export function cx(...values: ClassValue[]): string {
  return values.filter((value): value is string => Boolean(value)).join(" ");
}
