import { Suspense } from "react";

import { SearchScreen } from "@/components/search/search-screen";
import { ProtectedRoute } from "@/components/protected-route";

function SearchPageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">
      Chargement…
    </div>
  );
}

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<SearchPageFallback />}>
        <SearchScreen />
      </Suspense>
    </ProtectedRoute>
  );
}
