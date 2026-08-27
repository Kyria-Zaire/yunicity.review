/**
 * Cadence des modules contextuels du flux Feed (C3-FEED-UNIFIED-CONTEXT-STREAM-R1).
 *
 * ── Ce que ce module décide, et ce qu'il ignore ──────────────────────────────
 * Il répond à UNE question : quelle famille occupe quelle position, exprimée en
 * nombre de contenus réels déjà rendus. Il ne sait rien des publications, des
 * vidéos, ni de l'assemblage — c'est `feed-stream` qui compte les contenus et
 * pose les entrées. Sans cette séparation, la cadence dépendrait de la forme du
 * contenu ; ici elle n'en dépend pas, et se teste seule.
 *
 * ── Pourquoi des familles génériques ─────────────────────────────────────────
 * `must-see`, `local-privilege`, `tribes`, `local-now` nomment un CONTENU, pas
 * un écran. Aucun `Medium`, `Mobile` ni `Desktop` n'a sa place ici : les trois
 * bandes partageront cette même cadence et ne feront varier que le rendu.
 *
 * Contrat PUR : aucun DOM, aucun `window`, aucun breakpoint, aucune dépendance
 * React. Aucun état de session mutable non plus — la stabilité sous pagination
 * vient des positions ABSOLUES en contenus réels, pas d'une mémoire externe.
 */

export type FeedContextModuleFamily = "must-see" | "local-privilege" | "tribes" | "local-now";

/**
 * Ordre de priorité par défaut. Une famille indisponible ne réserve pas sa
 * place : la suivante avance, pour ne jamais laisser de trou artificiel.
 */
export const FEED_CONTEXT_MODULE_FAMILIES: readonly FeedContextModuleFamily[] = [
  "must-see",
  "local-privilege",
  "tribes",
  "local-now",
];

/**
 * Intervalles éditoriaux, en contenus réels : le premier module arrive après 4
 * contenus, puis après 6, 7 et 7 de plus.
 */
export const FEED_CONTEXT_SLOT_INTERVALS: readonly number[] = [4, 6, 7, 7];

/**
 * Positions cumulées — DÉRIVÉES des intervalles, jamais recopiées. Une seconde
 * liste écrite à la main pourrait diverger en silence.
 */
export const FEED_CONTEXT_SLOT_POSITIONS: readonly number[] = FEED_CONTEXT_SLOT_INTERVALS.reduce<
  number[]
>((positions, intervalle) => {
  const precedent = positions[positions.length - 1] ?? 0;
  positions.push(precedent + intervalle);
  return positions;
}, []);

/** Une famille, et le nombre de contenus réels après lequel elle s'insère. */
export type FeedContextPlacement = {
  family: FeedContextModuleFamily;
  afterRealContentCount: number;
};

/**
 * Où placer les familles réellement disponibles.
 *
 * L'ordre d'arrivée de `available` est ignoré : la priorité fait foi, et les
 * doublons sont écartés. Le résultat porte au plus une entrée par famille, sur
 * des positions strictement croissantes — deux modules ne peuvent donc jamais
 * se toucher.
 */
export function resolveFeedContextPlacements(
  available: readonly FeedContextModuleFamily[],
): FeedContextPlacement[] {
  const disponibles = new Set(available);
  return FEED_CONTEXT_MODULE_FAMILIES.filter((family) => disponibles.has(family))
    .slice(0, FEED_CONTEXT_SLOT_POSITIONS.length)
    .map((family, index) => ({
      family,
      afterRealContentCount: FEED_CONTEXT_SLOT_POSITIONS[index]!,
    }));
}
