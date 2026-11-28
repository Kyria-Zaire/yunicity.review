"use client";

import { WebAppShell } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import { PartnerPortalProvider } from "@/hooks/use-partner-portal-context";
import { resolvePartnerPortalContentWidth } from "@/lib/partner-portal/partner-portal-content-width";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function PartnerPortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ProtectedRoute>
      <PartnerPortalProvider>
        <WebAppShell
          header={{
            title: "Espace partenaire",
            subtitle:
              "Gérez votre présence Yunicity — offres Passport, événements et contenus créateurs.",
          }}
          contentWidth={resolvePartnerPortalContentWidth(pathname)}
        >
          {children}
        </WebAppShell>
      </PartnerPortalProvider>
    </ProtectedRoute>
  );
}
