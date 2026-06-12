import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Quartiers de Reims",
  description:
    "Parcourez les quartiers de Reims : ambiance, événements et adresses locales pour mieux vivre votre ville.",
  path: "/neighborhoods",
});

export default function NeighborhoodsLayout({ children }: { children: ReactNode }) {
  return children;
}
