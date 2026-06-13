"use client";

import { VideosScreen } from "@/components/videos/videos-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function VideosPage() {
  return (
    <ProtectedRoute>
      <VideosScreen />
    </ProtectedRoute>
  );
}
