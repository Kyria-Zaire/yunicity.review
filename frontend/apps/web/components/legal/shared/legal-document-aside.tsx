"use client";

import type { LegalDocumentDefinition } from "@/lib/legal/legal-document-contract";
import { LEGAL_COPY, LEGAL_ROUTES } from "@/lib/legal/legal-document-contract";
import Link from "next/link";

type LegalDocumentAsideProps = {
  document: LegalDocumentDefinition;
  variant?: "rail" | "inline";
};

export function LegalDocumentAside({ document, variant = "inline" }: LegalDocumentAsideProps) {
  return (
    <aside className={variant === "rail" ? "lg:sticky lg:top-24" : undefined}>
      <div className="space-y-4">
        {document.settingsHref ? (
          <section className="rounded-2xl border border-yunicity-primary/15 bg-yunicity-primary-soft p-5">
            <h2 className="text-sm font-bold text-neutral-950">Vos préférences</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Ajustez la visibilité de votre profil, vos notifications et vos choix de confidentialité.
            </p>
            <Link
              href={document.settingsHref}
              data-legal-control="settings-cta"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
            >
              {LEGAL_COPY.settingsCta}
            </Link>
          </section>
        ) : null}

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-950">{LEGAL_COPY.relatedTitle}</h2>
          <ul className="mt-3 space-y-2">
            {document.relatedDocuments.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-legal-control={`related-${item.href}`}
                  className="text-sm font-medium text-yunicity-primary hover:text-yunicity-primary-hover hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={LEGAL_ROUTES.help}
                data-legal-control="related-help"
                className="text-sm font-medium text-yunicity-primary hover:text-yunicity-primary-hover hover:underline"
              >
                {LEGAL_COPY.helpCta}
              </Link>
            </li>
          </ul>
          <a
            href={LEGAL_ROUTES.contact}
            data-legal-control="contact"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
          >
            {LEGAL_COPY.contactCta}
          </a>
        </section>
      </div>
    </aside>
  );
}
