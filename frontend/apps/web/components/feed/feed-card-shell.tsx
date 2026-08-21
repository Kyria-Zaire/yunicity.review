import type { ReactNode } from "react";

import { FEED_MOBILE_CARD_PADDING_CLASS } from "@/lib/layout/feed-mobile-full-bleed";

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
  const isMobile = layout === "mobile";
  const paddingClass = isMobile ? FEED_MOBILE_CARD_PADDING_CLASS : "p-5 sm:p-6";
  const footerPaddingClass = isMobile ? "px-4 py-2" : "px-4 py-2.5 sm:px-5 sm:py-3";
  const expandedPaddingClass = isMobile ? "px-4 pb-4 pt-3" : "px-5 pb-5 pt-4 sm:px-6";
  // Mobile (C3.1-R1D) : la publication touche les bords du viewport — ni rayon,
  // ni bordure verticale, ni ombre. La séparation entre publications est portée
  // par l'espacement de la liste, sur le fond gris du shell.
  const frameClass = isMobile
    ? "border-0 bg-white"
    : `rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${VARIANT_CLASS[variant]}`;

  return (
    <article data-feed-medium-surface="primary" className={`overflow-hidden ${frameClass}`}>
      <div className={paddingClass}>{children}</div>
      {footer ? (
        <footer className={`border-t border-neutral-100/90 ${footerPaddingClass}`}>{footer}</footer>
      ) : null}
      {expanded ? (
        <section className={`border-t border-neutral-100 ${expandedPaddingClass}`}>{expanded}</section>
      ) : null}
    </article>
  );
}
