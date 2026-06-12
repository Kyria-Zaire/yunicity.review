import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Fil local",
  description: "Votre fil d'actualité locale personnalisé sur Yunicity.",
  path: "/feed",
  noIndex: true,
});

export default function FeedLayout({ children }: { children: ReactNode }) {
  return children;
}
