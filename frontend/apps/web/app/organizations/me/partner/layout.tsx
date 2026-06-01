"use client";

import { WebAppShell } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import { PartnerPortalProvider } from "@/hooks/use-partner-portal-context";
import type { ReactNode } from "react";

export default function PartnerPortalLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <PartnerPortalProvider>
        <WebAppShell
          header={{
            title: "Espace partenaire",
            subtitle:
              "Gérez votre présence Yunicity — offres Passport, événements et contenus créateurs.",
          }}
          contentWidth="wide"
        >
          {children}
        </WebAppShell>
      </PartnerPortalProvider>
    </ProtectedRoute>
  );
}
