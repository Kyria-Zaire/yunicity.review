"use client";

import {
  LegalDocumentAside,
  LegalDocumentHero,
  LegalDocumentSections,
  LegalDocumentToc,
} from "@/components/legal/shared";
import type { LegalDocumentDefinition } from "@/lib/legal/legal-document-contract";
import { useState } from "react";

type LegalDocumentMobileScreenProps = {
  document: LegalDocumentDefinition;
};

export function LegalDocumentMobileScreen({ document }: LegalDocumentMobileScreenProps) {
  const [tocOpen, setTocOpen] = useState(false);
  const prefix = "m-";

  return (
    <div className="flex flex-col sm:hidden" data-legal-mobile-root="">
      <LegalDocumentHero document={document} variant="mobile" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <LegalDocumentToc
          sections={document.sections}
          sectionIdPrefix={prefix}
          variant="mobile-collapsible"
          mobileOpen={tocOpen}
          onMobileToggle={() => setTocOpen((open) => !open)}
        />
        <div className="mt-6">
          <LegalDocumentSections sections={document.sections} sectionIdPrefix={prefix} />
        </div>
        <div className="mt-8">
          <LegalDocumentAside document={document} variant="inline" />
        </div>
      </div>
    </div>
  );
}
