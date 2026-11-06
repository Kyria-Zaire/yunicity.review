/**
 * Logique de RANG du carrousel de publication (MEDIA-MULTI-PHOTO-01).
 *
 * Extraite du composant pour être éprouvée sans navigateur. ⚠️ Ces fonctions
 * ne prouvent PAS le câblage du défilement : jsdom n'implémente ni `scrollTo`
 * ni l'événement `scroll`. Le câblage est vérifié par la spec Playwright
 * `e2e/responsive/media-carousel-navigation.spec.ts`, en navigateur réel.
 */

/** Ramène un rang dans `[0, total - 1]`. Sans boucler : on ne revient pas de
 * la dernière photo à la première, le parcours a des bornes. */
export function clampCarouselIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.round(index), 0), total - 1);
}

/**
 * Rang de la diapositive affichée, d'après la position de défilement.
 *
 * Chaque diapositive fait exactement une page de large, donc le rang est le
 * quotient arrondi. L'arrondi — et non la troncature — est ce qui fait basculer
 * le compteur AU MILIEU du geste plutôt qu'à son terme : c'est ce que l'œil
 * attend quand la photo suivante occupe déjà plus de la moitié du cadre.
 */
export function carouselIndexFromScroll(
  scrollLeft: number,
  slideWidth: number,
  total: number,
): number {
  if (slideWidth <= 0) return 0;
  return clampCarouselIndex(scrollLeft / slideWidth, total);
}

/**
 * Le rang doit-il recevoir le focus parce que celui-ci était posé sur une
 * diapositive qui vient de cesser d'être courante ?
 *
 * ⚠️ `tabIndex={-1}` retire un élément de l'ordre de tabulation mais NE
 * DÉPLACE PAS un focus déjà présent. Sans ce calcul, un lecteur au clavier
 * resterait sur le bouton d'une photo sortie de l'écran.
 */
export function focusShouldFollowCurrent(
  focusedSlideIndex: number | null,
  current: number,
): boolean {
  if (focusedSlideIndex === null) return false;
  return focusedSlideIndex !== current;
}
