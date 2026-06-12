import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Sortir à Reims",
  description:
    "Agenda local : concerts, expositions, soirées et sorties à Reims. Découvrez les prochains événements près de chez vous sur Yunicity.",
  path: "/sortir",
});

export default function SortirLayout({ children }: { children: ReactNode }) {
  return children;
}
