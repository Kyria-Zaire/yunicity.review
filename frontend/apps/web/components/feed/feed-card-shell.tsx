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
}: {
  children: ReactNode;
  footer: ReactNode | null;
  expanded?: ReactNode;
  variant?: FeedCardVariant;
}) {
  /*
   * C3-FEED-UNIFIED-PUBLICATION-CARD-R2A : plus de prop `layout`. Les classes
   * ci-dessous decrivent la forme DESKTOP/MEDIUM ; `.feed-publication-frame`
   * ramene le bord a bord mobile (C3.1-R1D : ni rayon, ni bordure verticale,
   * ni ombre) sous 640, en CSS et non en JSX.
   */
  const paddingClass = "feed-publication-padding p-5 sm:p-6";
  const footerPaddingClass = "feed-publication-footer-padding px-4 py-2.5 sm:px-5 sm:py-3";
  const expandedPaddingClass = "feed-publication-expanded-padding px-5 pb-5 pt-4 sm:px-6";
  const frameClass = `feed-publication-frame rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${VARIANT_CLASS[variant]}`;

  return (
    <article data-feed-medium-surface="primary" className={`overflow-hidden ${frameClass}`}>
      <div data-feed-publication-editorial="">
        <div data-feed-publication-content="" className={paddingClass}>
          {children}
        </div>
        {footer ? (
          <footer
            data-feed-publication-actions=""
            className={`border-t border-neutral-100/90 ${footerPaddingClass}`}
          >
            {footer}
          </footer>
        ) : null}
      </div>
      {expanded ? (
        <section className={`border-t border-neutral-100 ${expandedPaddingClass}`}>{expanded}</section>
      ) : null}
    </article>
  );
}
