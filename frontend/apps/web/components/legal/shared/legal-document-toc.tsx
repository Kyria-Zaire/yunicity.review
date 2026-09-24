"use client";

import type { LegalDocumentSection } from "@/lib/legal/legal-document-contract";
import { LEGAL_COPY } from "@/lib/legal/legal-document-contract";
import Link from "next/link";

type LegalDocumentTocProps = {
  sections: readonly LegalDocumentSection[];
  sectionIdPrefix?: string;
  variant: "sidebar" | "inline" | "mobile-collapsible";
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
};

function TocList({
  sections,
  sectionIdPrefix,
  onNavigate,
}: {
  sections: readonly LegalDocumentSection[];
  sectionIdPrefix: string;
  onNavigate?: () => void;
}) {
  return (
    <ol className="space-y-1">
      {sections.map((section, index) => (
        <li key={section.id}>
          <Link
            href={`#${sectionIdPrefix}${section.id}`}
            onClick={onNavigate}
            data-legal-control={`toc-${section.id}`}
            className="block rounded-lg px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            <span className="mr-2 font-medium text-neutral-400">{index + 1}.</span>
            {section.title}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function LegalDocumentToc({
  sections,
  sectionIdPrefix = "",
  variant,
  mobileOpen = false,
  onMobileToggle,
}: LegalDocumentTocProps) {
  if (variant === "sidebar") {
    return (
      <nav aria-labelledby="legal-toc-title-desktop" className="sticky top-24">
        <h2 id="legal-toc-title-desktop" className="text-sm font-bold uppercase tracking-wide text-neutral-500">
          {LEGAL_COPY.tocTitle}
        </h2>
        <div className="mt-4 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
          <TocList sections={sections} sectionIdPrefix={sectionIdPrefix} />
        </div>
      </nav>
    );
  }

  if (variant === "inline") {
    return (
      <nav
        aria-labelledby="legal-toc-title-medium"
        className="rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-4"
      >
        <h2 id="legal-toc-title-medium" className="text-sm font-bold text-neutral-900">
          {LEGAL_COPY.tocTitle}
        </h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {sections.map((section, index) => (
            <Link
              key={section.id}
              href={`#${sectionIdPrefix}${section.id}`}
              data-legal-control={`toc-${section.id}`}
              className="inline-flex shrink-0 items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
            >
              {index + 1}. {section.title}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-labelledby="legal-toc-title-mobile" className="rounded-2xl border border-neutral-200/90 bg-white">
      <button
        type="button"
        onClick={onMobileToggle}
        aria-expanded={mobileOpen}
        data-legal-control="toc-toggle"
        className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-neutral-900"
      >
        {LEGAL_COPY.tocTitle}
        <span className="text-xs font-normal text-neutral-500">
          {mobileOpen ? LEGAL_COPY.tocCloseLabel : LEGAL_COPY.tocOpenLabel}
        </span>
      </button>
      {mobileOpen ? (
        <div className="border-t border-neutral-100 px-2 pb-3 pt-1">
          <TocList
            sections={sections}
            sectionIdPrefix={sectionIdPrefix}
            onNavigate={onMobileToggle}
          />
        </div>
      ) : null}
    </nav>
  );
}
