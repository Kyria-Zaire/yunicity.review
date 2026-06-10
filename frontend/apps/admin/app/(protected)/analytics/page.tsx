"use client";

import { AnalyticsPage } from "@/components/analytics/analytics-page";
import { StaffRoute } from "@/components/staff-route";

export default function AdminAnalyticsRoutePage() {
  return (
    <StaffRoute>
      <AnalyticsPage />
    </StaffRoute>
  );
}
