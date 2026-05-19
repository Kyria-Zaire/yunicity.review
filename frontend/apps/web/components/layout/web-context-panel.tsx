import type { ReactNode } from "react";

/** Panneau contextuel (conseils, actions, widgets) — colonne droite ou empilé mobile. */
export function WebContextPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-neutral-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      <section className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600">{children}</section>
    </article>
  );
}

/** @deprecated Utiliser WebContextPanel */
export { WebContextPanel as WebContextAside };
