import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Explorer",
  description: "Recherche locale sur Yunicity — réservée aux membres connectés.",
  path: "/search",
  noIndex: true,
});

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}
