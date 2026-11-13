import { NeighborhoodsExploreScreen } from "@/components/neighborhoods/neighborhoods-explore-screen";
import { NEIGHBORHOODS_LOADING } from "@yunicity/utils";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Explorer les quartiers de Reims | Yunicity",
  description:
    "Catalogue complet des 12 quartiers officiels de Reims — identité, ambiance et accès aux fiches détaillées.",
};

export default function NeighborhoodsExplorePage() {
  return (
    <Suspense
      fallback={<p className="px-4 py-6 text-sm text-neutral-500">{NEIGHBORHOODS_LOADING}</p>}
    >
      <NeighborhoodsExploreScreen />
    </Suspense>
  );
}
