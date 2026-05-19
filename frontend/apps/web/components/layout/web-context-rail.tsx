import type { ReactNode } from "react";

/** Colonne contextuelle desktop (xl+) — sticky, widgets secondaires. */
export function WebContextRail({ children }: { children: ReactNode }) {
  return (
    <aside className="hidden min-w-0 xl:block" aria-label="Informations contextuelles">
      <section className="sticky top-[var(--web-sticky-offset)] space-y-4">{children}</section>
    </aside>
  );
}

/** Même contenu que la rail, empilé sous le main sur mobile / tablette. */
export function WebContextStack({ children }: { children: ReactNode }) {
  return (
    <section className="mt-8 space-y-4 xl:hidden" aria-label="Informations contextuelles">
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
