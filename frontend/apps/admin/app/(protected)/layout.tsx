import { AdminShell } from "@/components/admin-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { StaffRoute } from "@/components/staff-route";
import type { ReactNode } from "react";

export default function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <StaffRoute>
        <AdminShell>{children}</AdminShell>
      </StaffRoute>
    </ProtectedRoute>
  );
}
