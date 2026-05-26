import type { ReactNode } from "react";

export type FeedCardVariant = "default" | "event" | "offer" | "organization";

const VARIANT_CLASS: Record<FeedCardVariant, string> = {
  default: "border-neutral-200/90",
  event: "border-neutral-200/90",
  offer: "border-neutral-200/90",
  organization: "border-neutral-200/90",
};

/** Enveloppe unique pour carte feed + barre d’actions — bordures neutres (WEB-HOME-01B). */
export function FeedCardShell({
  children,
  footer,
  expanded,
  variant = "default",
}: {
  children: ReactNode;
  footer: ReactNode;
  expanded?: ReactNode;
  variant?: FeedCardVariant;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${VARIANT_CLASS[variant]}`}
    >
      <div className="p-5 sm:p-6">{children}</div>
      <footer className="flex flex-wrap items-center gap-4 border-t border-neutral-100 bg-neutral-50/40 px-5 py-3 sm:px-6">
        {footer}
      </footer>
      {expanded ? (
        <section className="border-t border-neutral-100 px-5 pb-5 pt-4 sm:px-6">{expanded}</section>
      ) : null}
    </article>
  );
}
