import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Paramètres",
  description: "Paramètres de votre compte Yunicity.",
  path: "/settings",
  noIndex: true,
});

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
