"use client";

import { NewDiscussionScreen } from "@/components/discussions/new-discussion-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function NewDiscussionPage() {
  return (
    <ProtectedRoute>
      <NewDiscussionScreen />
    </ProtectedRoute>
  );
}
