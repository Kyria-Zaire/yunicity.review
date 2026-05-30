"use client";

import { StoriesScreen } from "@/components/stories/stories-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function StoriesPage() {
  return (
    <ProtectedRoute>
      <StoriesScreen />
    </ProtectedRoute>
  );
}
