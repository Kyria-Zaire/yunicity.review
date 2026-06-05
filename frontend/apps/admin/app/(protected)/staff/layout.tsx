"use client";

import { StaffRoute } from "@/components/staff-route";
import { SystemAdminRoute } from "@/components/staff/system-admin-route";
import type { ReactNode } from "react";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <StaffRoute>
      <SystemAdminRoute>{children}</SystemAdminRoute>
    </StaffRoute>
  );
}
