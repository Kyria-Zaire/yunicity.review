import { EventCreateScreen } from "@/components/events/create/event-create-screen";
import { ProtectedRoute } from "@/components/protected-route";
import { EVENT_CREATE_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function SortirCreateEventPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<p className="px-4 py-6 text-sm text-neutral-500">{EVENT_CREATE_LOADING}</p>}>
        <EventCreateScreen />
      </Suspense>
    </ProtectedRoute>
  );
}
