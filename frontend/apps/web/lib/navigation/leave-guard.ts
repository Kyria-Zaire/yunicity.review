/**
 * Garde de sortie d'un écran qui porte un brouillon (FEED-NEW-UX-01).
 *
 * ── Pourquoi un module, et pas un simple `onClick` ───────────────────────────
 * Sur `/feed/new`, le chrome réel est conservé : top nav desktop, rail medium,
 * en-tête et barre basse mobile, Create Hub. Ces surfaces ne connaissent pas
 * l'écran et naviguent par deux chemins distincts :
 *   - des liens `<a href>` (navigation, rail, barre basse, menus) ;
 *   - `router.push` (actions du Create Hub, voir `navigateFromCreateHub`).
 *
 * Un seul intercepteur, enregistré par l'écran tant que son brouillon est
 * modifié, couvre les deux : les liens par une écoute en CAPTURE au niveau du
 * document — elle passe avant le gestionnaire de `next/link` —, les
 * navigations programmatiques par `guardNavigation`.
 *
 * ⛔ Limite assumée : le bouton « précédent » du navigateur n'est PAS
 * intercepté. Le routeur Next pilote `history` ; y empiler un état sentinelle
 * entrerait en conflit avec lui. Le rechargement et la fermeture d'onglet sont,
 * eux, couverts par `beforeunload`.
 */

/**
 * Rend `true` quand la navigation est retenue : l'intercepteur s'engage alors
 * à appeler `proceed` lui-même, une fois la sortie confirmée.
 */
export type LeaveInterceptor = (proceed: () => void) => boolean;

let interceptor: LeaveInterceptor | null = null;

/** Un seul écran garde la sortie à la fois ; rend la fonction de retrait. */
export function registerLeaveInterceptor(next: LeaveInterceptor): () => void {
  interceptor = next;
  return () => {
    if (interceptor === next) interceptor = null;
  };
}

/** Point de passage des navigations programmatiques hors de l'écran gardé. */
export function guardNavigation(proceed: () => void): void {
  if (interceptor?.(proceed)) return;
  proceed();
}

/**
 * Le clic vise-t-il une navigation interne vers une AUTRE page ?
 *
 * Rend le chemin à ouvrir, ou `null` quand le navigateur doit garder la main :
 * nouvel onglet, téléchargement, lien externe, ancre sur la même page.
 */
export function internalLeaveTarget(event: MouseEvent, currentHref: string): string | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;

  const target = event.target;
  if (!(target instanceof Element)) return null;
  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;

  const current = new URL(currentHref);
  const destination = new URL(anchor.href, current);
  if (destination.origin !== current.origin) return null;
  if (destination.pathname === current.pathname && destination.search === current.search) {
    return null;
  }
  return `${destination.pathname}${destination.search}${destination.hash}`;
}
