import { HelpCenterPage } from "@/components/help/help-center-page";
import { HELP_CENTER_COPY } from "@/lib/help/help-center-contract";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: HELP_CENTER_COPY.pageTitle,
  description: HELP_CENTER_COPY.heroSubtitle,
  path: "/aide",
});

export default function AidePage() {
  return <HelpCenterPage />;
}
