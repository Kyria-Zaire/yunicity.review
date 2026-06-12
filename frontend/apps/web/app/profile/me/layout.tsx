import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Mon profil",
  description: "Gérez votre profil Yunicity.",
  path: "/profile/me",
  noIndex: true,
});

export default function ProfileMeLayout({ children }: { children: ReactNode }) {
  return children;
}
