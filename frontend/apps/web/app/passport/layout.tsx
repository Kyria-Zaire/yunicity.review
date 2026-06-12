import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Passport",
  description: "Votre Passport Yunicity — offres et tampons locaux.",
  path: "/passport",
  noIndex: true,
});

export default function PassportLayout({ children }: { children: ReactNode }) {
  return children;
}
