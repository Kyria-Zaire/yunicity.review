"use client";

import {
  LegalDocumentAside,
  LegalDocumentHero,
  LegalDocumentSections,
  LegalDocumentToc,
} from "@/components/legal/shared";
import type { LegalDocumentDefinition } from "@/lib/legal/legal-document-contract";

type LegalDocumentMediumScreenProps = {
  document: LegalDocumentDefinition;
};

export function LegalDocumentMediumScreen({ document }: LegalDocumentMediumScreenProps) {
  const prefix = "md-";

  return (
    <div className="hidden flex-col sm:flex lg:hidden" data-legal-medium-root="">
      <LegalDocumentHero document={document} variant="medium" />
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <LegalDocumentToc sections={document.sections} sectionIdPrefix={prefix} variant="inline" />
        <div className="mt-8 rounded-2xl border border-neutral-200/90 bg-white px-6 py-2 shadow-sm">
          <LegalDocumentSections sections={document.sections} sectionIdPrefix={prefix} />
        </div>
        <div className="mt-8 max-w-xl">
          <LegalDocumentAside document={document} variant="inline" />
        </div>
      </div>
    </div>
  );
}
