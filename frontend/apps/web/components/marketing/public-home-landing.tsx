"use client";

import { PublicHomeDesktopScreen } from "@/components/marketing/desktop";
import { PublicHomeMediumScreen } from "@/components/marketing/medium";
import { PublicHomeFooter } from "@/components/marketing/public-home-footer";
import { PublicHomeHeader } from "@/components/marketing/public-home-header";
import { PublicHomeMobileScreen } from "@/components/marketing/mobile";

export function PublicHomeLanding() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-neutral-900 [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))] [padding-left:max(1rem,env(safe-area-inset-left))] [padding-right:max(1rem,env(safe-area-inset-right))] [padding-top:max(0.75rem,env(safe-area-inset-top))]">
      <div className="pt-4">
        <PublicHomeHeader />
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-2 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <PublicHomeMobileScreen />
        <PublicHomeMediumScreen />
        <PublicHomeDesktopScreen />
      </main>

      <PublicHomeFooter />
    </div>
  );
}
