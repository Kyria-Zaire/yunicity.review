"use client";

import { NewLocalVideoScreen } from "@/components/videos/new-local-video-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function NewLocalVideoPage() {
  return (
    <ProtectedRoute>
      <NewLocalVideoScreen />
    </ProtectedRoute>
  );
}
