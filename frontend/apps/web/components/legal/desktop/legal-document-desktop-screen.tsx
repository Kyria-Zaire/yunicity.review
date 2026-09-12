"use client";

import {
  LegalDocumentAside,
  LegalDocumentHero,
  LegalDocumentSections,
  LegalDocumentToc,
} from "@/components/legal/shared";
import type { LegalDocumentDefinition } from "@/lib/legal/legal-document-contract";

type LegalDocumentDesktopScreenProps = {
  document: LegalDocumentDefinition;
};

export function LegalDocumentDesktopScreen({ document }: LegalDocumentDesktopScreenProps) {
  const prefix = "d-";

  return (
    <div className="hidden lg:block" data-legal-desktop-root="">
      <LegalDocumentHero document={document} variant="desktop" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_280px] lg:px-8">
        <LegalDocumentToc sections={document.sections} sectionIdPrefix={prefix} variant="sidebar" />
        <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-white px-8 py-2 shadow-sm">
          <LegalDocumentSections sections={document.sections} sectionIdPrefix={prefix} />
        </div>
        <LegalDocumentAside document={document} variant="rail" />
      </div>
    </div>
  );
}
