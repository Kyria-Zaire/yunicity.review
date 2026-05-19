"use client";

import { PassportScreen } from "@/components/passport/passport-screen";
import { ProtectedRoute } from "@/components/protected-route";

export default function PassportPage() {
  return (
    <ProtectedRoute>
      <PassportScreen />
    </ProtectedRoute>
  );
}
