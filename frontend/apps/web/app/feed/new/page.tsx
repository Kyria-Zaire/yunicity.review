"use client";

import { NewPostScreen } from "@/components/feed/post-composer/new-post-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function NewFeedPostPage() {
  return (
    <ProtectedRoute>
      <NewPostScreen />
    </ProtectedRoute>
  );
}
