import { TribeCreateScreen } from "@/components/tribes/create/tribe-create-screen";
import { ProtectedRoute } from "@/components/protected-route";
import { TRIBE_CREATE_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function TribeCreatePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<p className="px-4 py-6 text-sm text-neutral-500">{TRIBE_CREATE_LOADING}</p>}>
        <TribeCreateScreen />
      </Suspense>
    </ProtectedRoute>
  );
}
