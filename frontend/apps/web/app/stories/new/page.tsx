"use client";

import { NewStoryScreen } from "@/components/stories/new-story-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function NewStoryPage() {
  return (
    <ProtectedRoute>
      <NewStoryScreen />
    </ProtectedRoute>
  );
}
