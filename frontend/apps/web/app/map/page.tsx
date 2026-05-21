import { EventMapScreen } from "@/components/map/event-map-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function MapPage() {
  return (
    <ProtectedRoute>
      <EventMapScreen />
    </ProtectedRoute>
  );
}
