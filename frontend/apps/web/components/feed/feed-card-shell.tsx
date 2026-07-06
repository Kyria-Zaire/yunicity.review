import type { ReactNode } from "react";

export type FeedCardVariant = "default" | "event" | "offer" | "organization" | "partner_creator";

const VARIANT_CLASS: Record<FeedCardVariant, string> = {
  default: "border-neutral-200/90",
  event: "border-neutral-200/90",
  offer: "border-neutral-200/90",
  organization: "border-neutral-200/90",
  partner_creator: "border-neutral-200/90",
};

/** Enveloppe unique pour carte feed + barre d’actions — bordures neutres (WEB-HOME-01B). */
export function FeedCardShell({
  children,
  footer,
  expanded,
  variant = "default",
  layout = "default",
}: {
  children: ReactNode;
  footer: ReactNode | null;
  expanded?: ReactNode;
  variant?: FeedCardVariant;
  layout?: "default" | "mobile";
}) {
  const paddingClass = layout === "mobile" ? "p-4" : "p-5 sm:p-6";
  const footerPaddingClass = layout === "mobile" ? "px-3 py-2" : "px-4 py-2.5 sm:px-5 sm:py-3";

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${VARIANT_CLASS[variant]}`}
    >
      <div className={paddingClass}>{children}</div>
      {footer ? (
        <footer className={`border-t border-neutral-100/90 ${footerPaddingClass}`}>{footer}</footer>
      ) : null}
      {expanded ? (
        <section className="border-t border-neutral-100 px-5 pb-5 pt-4 sm:px-6">{expanded}</section>
      ) : null}
    </article>
  );
}
