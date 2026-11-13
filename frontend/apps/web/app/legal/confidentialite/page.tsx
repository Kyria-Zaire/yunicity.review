import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { getLegalDocument } from "@/lib/legal/legal-document-contract";
import { buildPageMetadata } from "@/lib/seo/metadata";

const document = getLegalDocument("privacy");

export const metadata = buildPageMetadata({
  title: document.title,
  description: document.description,
  path: "/legal/confidentialite",
});

export default function LegalPrivacyPage() {
  return <LegalDocumentPage documentId="privacy" />;
}
