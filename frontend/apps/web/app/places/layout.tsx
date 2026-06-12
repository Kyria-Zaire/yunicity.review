import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Lieux culturels à Reims",
  description:
    "Explorez les lieux culturels, bars, restaurants et adresses locales à Reims. Trouvez votre prochaine sortie sur Yunicity.",
  path: "/places",
});

export default function PlacesLayout({ children }: { children: ReactNode }) {
  return children;
}
