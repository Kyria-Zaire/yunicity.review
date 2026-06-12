import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Contenus créateurs à Reims",
  description:
    "Articles et photos de la scène locale rémoise : découvrez les dernières publications des créateurs Yunicity.",
  path: "/creator-content",
});

export default function CreatorContentLayout({ children }: { children: ReactNode }) {
  return children;
}
