import { StaffRoute } from "@/components/staff-route";
import type { ReactNode } from "react";

export default function PartnerLeadsStaffLayout({ children }: { children: ReactNode }) {
  return <StaffRoute>{children}</StaffRoute>;
}
