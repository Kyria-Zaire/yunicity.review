import { PlacesScreen } from "@/components/places/places-screen";
import { PLACES_PORTAL_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function PlacesPage() {
  return (
    <Suspense fallback={<p className="px-4 py-6 text-sm text-neutral-500">{PLACES_PORTAL_LOADING}</p>}>
      <PlacesScreen />
    </Suspense>
  );
}
