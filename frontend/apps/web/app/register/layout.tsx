import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Inscription",
  description: "Créez votre compte Yunicity et découvrez Reims autrement.",
  path: "/register",
  noIndex: true,
});

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
