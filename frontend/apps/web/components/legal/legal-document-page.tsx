"use client";

import { LegalDocumentDesktopScreen } from "@/components/legal/desktop";
import { LegalDocumentMediumScreen } from "@/components/legal/medium";
import { LegalDocumentMobileScreen } from "@/components/legal/mobile";
import { LegalDocumentShell } from "@/components/legal/legal-document-shell";
import {
  getLegalDocument,
  type LegalDocumentId,
} from "@/lib/legal/legal-document-contract";

type LegalDocumentPageProps = {
  documentId: LegalDocumentId;
};

export function LegalDocumentPage({ documentId }: LegalDocumentPageProps) {
  const document = getLegalDocument(documentId);

  return (
    <LegalDocumentShell>
      <main>
        <LegalDocumentMobileScreen document={document} />
        <LegalDocumentMediumScreen document={document} />
        <LegalDocumentDesktopScreen document={document} />
      </main>
    </LegalDocumentShell>
  );
}
