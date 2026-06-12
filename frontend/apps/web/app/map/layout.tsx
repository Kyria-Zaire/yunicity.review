import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Carte",
  description: "Carte interactive des événements et lieux à Reims.",
  path: "/map",
  noIndex: true,
});

export default function MapLayout({ children }: { children: ReactNode }) {
  return children;
}
