"use client";

import { FeedScreen } from "@/components/feed/feed-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function FeedPage() {
  return (
    <ProtectedRoute>
      <FeedScreen />
    </ProtectedRoute>
  );
}
