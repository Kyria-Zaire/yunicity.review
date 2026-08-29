import type { ReactNode } from "react";

/** Panneau contextuel (conseils, actions, widgets) — colonne droite ou empilé mobile. */
export function WebContextPanel({
  title,
  action,
  children,
  tone = "default",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  /** `feed` : titres sentence-case du rail feed desktop refonte. */
  tone?: "default" | "feed";
}) {
  const titleClass =
    tone === "feed"
      ? "text-sm font-bold text-neutral-900"
      : "text-xs font-semibold uppercase tracking-wide text-neutral-500";

  return (
    <article
      data-web-context-panel=""
      data-web-context-tone={tone}
      className="rounded-2xl border border-yunicity-border bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className={titleClass}>{title}</h2>
        {action ?? null}
      </div>
      <section className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600">{children}</section>
    </article>
  );
}

/** @deprecated Utiliser WebContextPanel */
export { WebContextPanel as WebContextAside };
