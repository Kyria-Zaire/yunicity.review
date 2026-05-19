import type { ReactNode } from "react";

/** Enveloppe unique pour carte feed + barre d’actions (évite bordures décalées). */
export function FeedCardShell({
  children,
  footer,
  expanded,
}: {
  children: ReactNode;
  footer: ReactNode;
  expanded?: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-yunicity-border bg-white shadow-sm">
      <div className="p-6">{children}</div>
      <footer className="flex flex-wrap items-center gap-4 border-t border-yunicity-border px-6 py-3">
        {footer}
      </footer>
      {expanded ? (
        <section className="border-t border-yunicity-border px-6 pb-5 pt-4">{expanded}</section>
      ) : null}
    </article>
  );
}
