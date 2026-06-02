import { SettingsScreen } from "@/components/settings/settings-screen";
import { ProtectedRoute } from "@/components/protected-route";
import { SETTINGS_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<p className="px-4 py-6 text-sm text-neutral-500">{SETTINGS_LOADING}</p>}>
        <SettingsScreen />
      </Suspense>
    </ProtectedRoute>
  );
}
