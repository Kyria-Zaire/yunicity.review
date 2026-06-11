"use client";

import { ActivityPage } from "@/components/activity/activity-page";
import { StaffRoute } from "@/components/staff-route";

export default function AdminActivityRoutePage() {
  return (
    <StaffRoute>
      <ActivityPage />
    </StaffRoute>
  );
}
