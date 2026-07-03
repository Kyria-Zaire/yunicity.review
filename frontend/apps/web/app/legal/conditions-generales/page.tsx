import { LegalDocumentScreen } from "@/components/legal/legal-document-screen";
import {
  LEGAL_TERMS_BODY,
  LEGAL_TERMS_INTRO,
  LEGAL_TERMS_PAGE_TITLE,
} from "@/lib/legal/legal-document-content";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: LEGAL_TERMS_PAGE_TITLE,
  description: LEGAL_TERMS_INTRO,
  path: "/legal/conditions-generales",
});

export default function LegalTermsPage() {
  return (
    <LegalDocumentScreen
      title={LEGAL_TERMS_PAGE_TITLE}
      intro={LEGAL_TERMS_INTRO}
      body={LEGAL_TERMS_BODY}
    />
  );
}
