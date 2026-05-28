import { EventMapScreen } from "@/components/map/event-map-screen";
import { ProtectedRoute } from "@/components/protected-route";
import { MAP_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function MapPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <p className="px-4 py-6 text-sm text-neutral-500" role="status">
            {MAP_LOADING}
          </p>
        }
      >
        <EventMapScreen />
      </Suspense>
    </ProtectedRoute>
  );
}
