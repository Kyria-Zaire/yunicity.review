"use client";

import type { LegalDocumentDefinition } from "@/lib/legal/legal-document-contract";
import { LEGAL_COPY } from "@/lib/legal/legal-document-contract";
import Link from "next/link";

type LegalDocumentHeroProps = {
  document: LegalDocumentDefinition;
  variant: "mobile" | "medium" | "desktop";
};

const VARIANT_CLASSES = {
  mobile: {
    section: "px-4 py-8",
    title: "text-2xl font-bold tracking-tight text-neutral-950",
    meta: "mt-3 flex flex-col gap-1 text-xs text-neutral-500",
    intro: "mt-4 text-sm leading-relaxed text-neutral-600",
  },
  medium: {
    section: "px-6 py-10",
    title: "text-3xl font-bold tracking-tight text-neutral-950",
    meta: "mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-500",
    intro: "mt-5 max-w-3xl text-base leading-relaxed text-neutral-600",
  },
  desktop: {
    section: "border-b border-neutral-200/80 bg-neutral-50/80 px-4 py-12 sm:px-6 lg:px-8",
    title: "text-4xl font-bold tracking-tight text-neutral-950",
    meta: "mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-neutral-500",
    intro: "mt-5 max-w-3xl text-base leading-relaxed text-neutral-600",
  },
} as const;

export function LegalDocumentHero({ document, variant }: LegalDocumentHeroProps) {
  const styles = VARIANT_CLASSES[variant];

  return (
    <header className={styles.section}>
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-medium text-yunicity-primary hover:text-yunicity-primary-hover hover:underline"
          data-legal-control="back-home"
        >
          ← {LEGAL_COPY.backHome}
        </Link>
        <h1 className={`mt-4 ${styles.title}`}>{document.title}</h1>
        <dl className={styles.meta}>
          <div className="flex gap-2">
            <dt className="font-medium text-neutral-700">{LEGAL_COPY.lastUpdatedLabel}</dt>
            <dd>{document.lastUpdated}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-neutral-700">{LEGAL_COPY.effectiveDateLabel}</dt>
            <dd>{document.effectiveDate}</dd>
          </div>
        </dl>
        <p className={styles.intro}>{document.intro}</p>
        <p className="mt-3 text-xs text-neutral-400">{LEGAL_COPY.printHint}</p>
      </div>
    </header>
  );
}
