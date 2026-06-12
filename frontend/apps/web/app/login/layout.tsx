import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Connexion",
  description: "Connectez-vous à Yunicity pour rejoindre la communauté locale de Reims.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
