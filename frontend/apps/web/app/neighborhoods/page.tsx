import { NeighborhoodsScreen } from "@/components/neighborhoods/neighborhoods-screen";
import { NEIGHBORHOODS_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function NeighborhoodsPage() {
  return (
    <Suspense fallback={<p className="px-4 py-6 text-sm text-neutral-500">{NEIGHBORHOODS_LOADING}</p>}>
      <NeighborhoodsScreen />
    </Suspense>
  );
}
