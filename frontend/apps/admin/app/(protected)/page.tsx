"use client";

import { CockpitPage } from "@/components/cockpit/cockpit-page";
import { StaffRoute } from "@/components/staff-route";

export default function AdminCockpitHomePage() {
  return (
    <StaffRoute>
      <CockpitPage />
    </StaffRoute>
  );
}
