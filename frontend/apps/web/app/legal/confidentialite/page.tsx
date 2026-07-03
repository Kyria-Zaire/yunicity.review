import { LegalDocumentScreen } from "@/components/legal/legal-document-screen";
import {
  LEGAL_PRIVACY_BODY,
  LEGAL_PRIVACY_INTRO,
  LEGAL_PRIVACY_PAGE_TITLE,
} from "@/lib/legal/legal-document-content";
import { settingsSectionDomId } from "@yunicity/utils";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: LEGAL_PRIVACY_PAGE_TITLE,
  description: LEGAL_PRIVACY_INTRO,
  path: "/legal/confidentialite",
});

export default function LegalPrivacyPage() {
  return (
    <LegalDocumentScreen
      title={LEGAL_PRIVACY_PAGE_TITLE}
      intro={LEGAL_PRIVACY_INTRO}
      body={LEGAL_PRIVACY_BODY}
      settingsHref={`/settings#${settingsSectionDomId("privacy")}`}
    />
  );
}
