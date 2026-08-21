"use client";

import { ExplorerTriggerButton } from "@/components/explorer";
import { CitizenAccountMenu } from "@/components/layout/citizen-account-menu";
import { CitizenYunicityMenu } from "@/components/layout/citizen-yunicity-menu";
import { useAuth } from "@/lib/auth/auth-provider";

/**
 * Actions header mobile (C3.1-R1) — Explorer, Menu Yunicity, CTA Profil connecté.
 * Notifications : uniquement dans Menu Yunicity. Pas de faux CTA Profil visiteur.
 */
export function CitizenMobileHeaderActions() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <ExplorerTriggerButton variant="compact-mobile" />

      <CitizenYunicityMenu variant="mobile-header" />

      {isAuthenticated ? <CitizenAccountMenu variant="mobile-header" /> : null}
    </div>
  );
}
