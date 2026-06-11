"use client";

import { SettingsPage } from "@/components/settings/settings-page";
import { StaffRoute } from "@/components/staff-route";

export default function AdminSettingsRoutePage() {
  return (
    <StaffRoute>
      <SettingsPage />
    </StaffRoute>
  );
}
