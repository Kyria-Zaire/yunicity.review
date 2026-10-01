import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { getLegalDocument } from "@/lib/legal/legal-document-contract";
import { buildPageMetadata } from "@/lib/seo/metadata";

const document = getLegalDocument("terms");

export const metadata = buildPageMetadata({
  title: document.title,
  description: document.description,
  path: "/legal/conditions-generales",
});

export default function LegalTermsPage() {
  return <LegalDocumentPage documentId="terms" />;
}
