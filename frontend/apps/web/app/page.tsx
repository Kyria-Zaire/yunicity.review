import { PublicHomePage } from "@/components/marketing/public-home-page";
import { buildPageMetadata, SITE_DEFAULT_METADATA } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: SITE_DEFAULT_METADATA.defaultTitle,
  description: SITE_DEFAULT_METADATA.defaultDescription,
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return <PublicHomePage />;
}
