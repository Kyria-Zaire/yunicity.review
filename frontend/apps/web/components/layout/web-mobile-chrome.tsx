"use client";

import { ExplorerTriggerButton } from "@/components/explorer";
import { YunicityLogo } from "@/components/brand";
import { CitizenYunicityMenu } from "@/components/layout/citizen-yunicity-menu";
import { useAuth } from "@/lib/auth/auth-provider";

/**
 * Header mobile (< md) — Navbar V3 (C3.1-T2).
 *
 * Les quatre destinations vivent dans la bottom-nav : le header ne les répète plus (il
 * portait auparavant une barre de pastilles défilante annoncée « Navigation principale »,
 * ce qui dupliquait le landmark de navigation à 390 px).
 *
 * Il porte les fonctions stratégiques : accès Explorer Reims (vers `/search` en T2,
 * overlay en T3) et Menu Yunicity — visible, jamais enfoui derrière le profil.
 */
export function WebMobileHeader() {
  return (
    <header className="web-mobile-chrome-only sticky top-0 z-20 border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 px-4 py-3">
        <YunicityLogo href="/feed" size="sm" showWordmark priority />

        <div className="ml-auto flex items-center gap-1">
          <ExplorerTriggerButton variant="compact-mobile" className="min-w-11 px-3" />

          <CitizenYunicityMenu variant="mobile-header" />
        </div>
      </div>
    </header>
  );
}

/** Pied de page mobile : compte connecté. */
export function WebMobileFooter() {
  const { user } = useAuth();

  return (
    <footer className="web-mobile-chrome-only border-t border-neutral-200/60 px-4 py-6 text-center text-xs text-neutral-500">
      <p>{user?.email}</p>
    </footer>
  );
}
