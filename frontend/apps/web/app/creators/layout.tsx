import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Créateurs locaux à Reims",
  description:
    "Découvrez les créateurs, partenaires et voix locales qui font vibrer Reims. Articles, photos et contenus de la scène rémoise.",
  path: "/creators",
});

export default function CreatorsLayout({ children }: { children: ReactNode }) {
  return children;
}
