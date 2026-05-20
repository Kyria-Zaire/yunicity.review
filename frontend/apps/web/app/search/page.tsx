import { SearchScreen } from "@/components/search/search-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <SearchScreen />
    </ProtectedRoute>
  );
}
