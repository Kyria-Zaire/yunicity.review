/**
 * Pile modale interne (C3.0-T3-R2). Jamais exportée par l'API publique.
 *
 * Un simple compteur ne suffit pas : avec des overlays imbriqués, il faut savoir LEQUEL est
 * au sommet. Règle autoritaire :
 *
 * - seul l'overlay au sommet est actif (Escape, Tab, piège de focus, accessibilité) ;
 * - tout le reste — contenu applicatif ET overlays sous-jacents — est `inert` + `aria-hidden` ;
 * - les overlays sous-jacents restent MONTÉS (leur état, leur scroll, leurs champs survivent) ;
 * - à la fermeture du sommet, le précédent redevient actif ;
 * - une fermeture dans le désordre est supportée (retrait par identité, pas par dépilement) ;
 * - pile vide ⇒ le DOM retrouve son état initial EXACT.
 *
 * L'inertie est recalculée entièrement à chaque changement de pile (`syncInertState`) plutôt
 * que par compteur par élément : l'état visé se déduit de la pile, il ne peut donc pas dériver.
 */
export const OVERLAY_ROOT_ATTRIBUTE = "data-yunicity-overlay-root";

type SavedAttributes = { ariaHidden: string | null; inert: string | null };

/** Ordre d'ouverture : le dernier élément est le sommet. */
const stack: HTMLElement[] = [];

/** Éléments actuellement neutralisés, avec leur état ANTÉRIEUR à restaurer tel quel. */
const neutralized = new Map<Element, SavedAttributes>();

export function registerOverlay(root: HTMLElement): () => void {
  stack.push(root);
  syncInertState();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const index = stack.lastIndexOf(root);
    if (index >= 0) stack.splice(index, 1);
    syncInertState();
  };
}

/** Le sommet est le seul overlay qui reçoit le clavier et piège le focus. */
export function isTopmostOverlay(root: HTMLElement | null): boolean {
  return root !== null && stack.length > 0 && stack[stack.length - 1] === root;
}

/** Exposé aux tests uniquement. */
export function overlayStackSize(): number {
  return stack.length;
}

/** Filet de sécurité d'isolation entre tests. Jamais appelé en production. */
export function resetOverlayStackForTests(): void {
  stack.length = 0;
  syncInertState();
}

function syncInertState(): void {
  if (typeof document === "undefined") return;

  const topmost = stack.length > 0 ? stack[stack.length - 1] : null;
  const target = new Set<Element>();
  if (topmost) {
    for (const child of Array.from(document.body.children)) {
      if (child !== topmost) target.add(child);
    }
  }

  for (const element of Array.from(neutralized.keys())) {
    if (target.has(element)) continue;
    revive(element);
  }

  for (const element of target) {
    if (neutralized.has(element)) continue;
    neutralized.set(element, {
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.getAttribute("inert"),
    });
    element.setAttribute("aria-hidden", "true");
    element.setAttribute("inert", "");
  }
}

function revive(element: Element): void {
  const saved = neutralized.get(element);
  neutralized.delete(element);
  if (!saved) return;
  restoreAttribute(element, "aria-hidden", saved.ariaHidden);
  restoreAttribute(element, "inert", saved.inert);
}

function restoreAttribute(element: Element, name: string, previous: string | null): void {
  if (previous === null) {
    element.removeAttribute(name);
    return;
  }
  element.setAttribute(name, previous);
}
