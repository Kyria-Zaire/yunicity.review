import { DiscussionsScreen } from "@/components/discussions/discussions-screen";
import { ProtectedRoute } from "@/components/protected-route";
import { DISCUSSIONS_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function DiscussionsPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={<p className="px-4 py-6 text-sm text-neutral-500">{DISCUSSIONS_LOADING}</p>}
      >
        <DiscussionsScreen />
      </Suspense>
    </ProtectedRoute>
  );
}
