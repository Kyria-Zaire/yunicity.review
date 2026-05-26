import type { ReactNode } from "react";

/** Colonne contextuelle — lg+ dans la grille, sticky + scroll interne si débordement. */
export function WebContextRail({ children }: { children: ReactNode }) {
  return (
    <aside className="web-context-rail-aside min-w-0" aria-label="Informations contextuelles">
      <section className="space-y-4 py-2">{children}</section>
    </aside>
  );
}

/** Même contenu que la rail, empilé sous le main sur mobile / tablette. */
export function WebContextStack({ children }: { children: ReactNode }) {
  return (
    <section className="web-mobile-chrome-only mt-8 space-y-4" aria-label="Informations contextuelles">
      {children}
    </section>
  );
}

/** Desktop rail + empilement mobile automatique. */
export function WebContextDual({ children }: { children: ReactNode }) {
  return (
    <>
      <WebContextRail>{children}</WebContextRail>
      <WebContextStack>{children}</WebContextStack>
    </>
  );
}
