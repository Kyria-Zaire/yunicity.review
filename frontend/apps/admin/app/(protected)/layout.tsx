import { AdminShell } from "@/components/admin-shell";
import { ProtectedRoute } from "@/components/protected-route";
import type { ReactNode } from "react";

export default function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
