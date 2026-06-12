import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Discussions",
  description: "Discussions locales sur Yunicity.",
  path: "/discussions",
  noIndex: true,
});

export default function DiscussionsLayout({ children }: { children: ReactNode }) {
  return children;
}
